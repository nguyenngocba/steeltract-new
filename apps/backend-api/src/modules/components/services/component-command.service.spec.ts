import { ConflictException } from '@nestjs/common';
import { ComponentLifecycleState } from '@prisma/client';

import { ComponentCommandService } from './component-command.service';

type TestOutboxEvent = {
  eventName: string;
  metadata?: unknown;
  payload?: unknown;
  [key: string]: unknown;
};

describe('ComponentCommandService atomic command boundary', () => {
  it('writes Component, audit evidence and canonical event in one transaction', async () => {
    const tx = { marker: 'component-command-tx' };
    const component = {
      id: 'component-1',
      code: 'C-001',
      name: 'Column',
      description: null,
      lifecycleState: ComponentLifecycleState.DRAFT,
      aggregateVersion: 1,
    };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(component),
      createTimeline: jest.fn().mockResolvedValue({ id: 'timeline-1' }),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest
        .fn()
        .mockResolvedValueOnce({ id: 'audit-outbox-1' })
        .mockResolvedValueOnce({ id: 'domain-outbox-1' }),
    };
    const service = new ComponentCommandService(repository as never);

    await service.create({
      code: 'C-001',
      name: 'Column',
      actorId: 'user-1',
      idempotencyKey: 'command-1',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        lifecycleState: ComponentLifecycleState.DRAFT,
        aggregateVersion: 1,
      }),
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'component.created' }),
      tx,
    );
    expect(repository.createTimeline).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'component.created' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        eventName: 'component.created',
        idempotencyKey: 'command-1:component.created',
        maxRetries: 10,
      }),
      tx,
    );
  });

  it('replays an exact command without duplicate persistence or evidence', async () => {
    const tx = { marker: 'component-command-tx' };
    const component = {
      id: 'component-1',
      code: 'C-001',
      name: 'Column',
      description: null,
      lifecycleState: ComponentLifecycleState.DRAFT,
      aggregateVersion: 1,
    };
    let replayEvent: TestOutboxEvent | null = null;
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn(async () => replayEvent),
      findAggregate: jest.fn().mockResolvedValue(component),
      create: jest.fn().mockResolvedValue(component),
      createTimeline: jest.fn().mockResolvedValue({ id: 'timeline-1' }),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: jest.fn(async (event: TestOutboxEvent) => {
        if (event.eventName === 'component.created') replayEvent = event;
        return event;
      }),
    };
    const service = new ComponentCommandService(repository as never);
    const command = {
      code: 'C-001',
      name: 'Column',
      actorId: 'user-1',
      idempotencyKey: 'command-1',
    };

    const first = await service.create(command);
    const replay = await service.create(command);

    expect(first).toBe(component);
    expect(replay).toBe(component);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.createTimeline).toHaveBeenCalledTimes(1);
    expect(repository.createActivityLog).toHaveBeenCalledTimes(1);
    expect(repository.createOutboxEvent).toHaveBeenCalledTimes(2);
  });

  it('rejects reuse of an idempotency key with a different command', async () => {
    const tx = { marker: 'component-command-tx' };
    const component = {
      id: 'component-1',
      code: 'C-001',
      name: 'Column',
      description: null,
      lifecycleState: ComponentLifecycleState.DRAFT,
      aggregateVersion: 1,
    };
    let replayEvent: TestOutboxEvent | null = null;
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn(async () => replayEvent),
      findAggregate: jest.fn().mockResolvedValue(component),
      create: jest.fn().mockResolvedValue(component),
      createTimeline: jest.fn().mockResolvedValue({}),
      createActivityLog: jest.fn().mockResolvedValue({}),
      createOutboxEvent: jest.fn(async (event: TestOutboxEvent) => {
        if (event.eventName === 'component.created') replayEvent = event;
        return event;
      }),
    };
    const service = new ComponentCommandService(repository as never);

    await service.create({
      code: 'C-001',
      name: 'Column',
      actorId: 'user-1',
      idempotencyKey: 'command-1',
    });

    await expect(
      service.create({
        code: 'C-002',
        name: 'Beam',
        actorId: 'user-1',
        idempotencyKey: 'command-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it('rejects a stale version without writing audit or domain events', async () => {
    const tx = { marker: 'component-command-tx' };
    const repository = {
      transaction: jest.fn((callback) => callback(tx)),
      findOutboxEvent: jest.fn().mockResolvedValue(null),
      findAggregate: jest.fn().mockResolvedValue({
        id: 'component-1',
        code: 'C-001',
        lifecycleState: ComponentLifecycleState.ACTIVE,
        aggregateVersion: 4,
        currentRevisionId: 'revision-1',
      }),
      updateAggregate: jest.fn().mockResolvedValue(null),
      createTimeline: jest.fn(),
      createActivityLog: jest.fn(),
      createOutboxEvent: jest.fn(),
    };
    const service = new ComponentCommandService(repository as never);

    await expect(
      service.deprecate({
        componentId: 'component-1',
        expectedVersion: 3,
        reason: 'Replaced',
        actorId: 'user-1',
        idempotencyKey: 'deprecate-component-1-v3',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createTimeline).not.toHaveBeenCalled();
    expect(repository.createActivityLog).not.toHaveBeenCalled();
    expect(repository.createOutboxEvent).not.toHaveBeenCalled();
  });
});
