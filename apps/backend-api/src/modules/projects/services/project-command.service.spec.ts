import { BadRequestException, ConflictException } from '@nestjs/common';
import { ProjectStatus, ProjectTaskStatus } from '@prisma/client';

import {
  ProjectAggregate,
  ProjectTaskAggregate,
} from '../domain/project.aggregate';
import { ProjectCommandService } from './project-command.service';

describe('Project canonical domain', () => {
  const baseTime = new Date('2026-07-17T00:00:00.000Z');

  function project(
    status: ProjectStatus = ProjectStatus.ACTIVE,
    taskStatus: ProjectTaskStatus = ProjectTaskStatus.COMPLETED,
  ) {
    return {
      id: 'project-1',
      code: 'PRJ-001',
      name: 'Project One',
      description: null,
      status,
      createdAt: baseTime,
      updatedAt: baseTime,
      tasks: [
        {
          id: 'task-1',
          projectId: 'project-1',
          parentTaskId: 'phase-1',
          status: taskStatus,
        },
      ],
    };
  }

  function setup(initialProject: Record<string, any> | null = project()) {
    const tx = { id: 'project-tx' };
    const outbox = new Map<string, any>();
    let current = initialProject;
    let allocation: Record<string, any> | null = null;
    const task = {
      id: 'task-1',
      projectId: 'project-1',
      parentTaskId: 'phase-1',
      status: ProjectTaskStatus.COMPLETED,
      actualStartAt: baseTime,
      actualFinishAt: baseTime,
      progress: 100,
    };
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      findOutboxEvent: jest.fn(async (key) => outbox.get(key) ?? null),
      findProjectAcceptanceEvents: jest.fn(async () =>
        Array.from(outbox.values()).filter(
          (event) =>
            event.eventName === 'project.acceptance.completed' &&
            event.payload.projectId === 'project-1',
        ),
      ),
      createOutboxEvent: jest.fn(async (data) => {
        const existing = outbox.get(data.idempotencyKey);
        if (existing) return existing;
        const created = { id: `event-${outbox.size + 1}`, ...data };
        outbox.set(data.idempotencyKey, created);
        return created;
      }),
      create: jest.fn(async (data) => {
        current = {
          ...project(ProjectStatus.PLANNING),
          code: data.code,
          name: data.name,
          description: data.description ?? null,
          tasks: [],
        };
        return current;
      }),
      findAggregate: jest.fn(async () => current),
      updateVersioned: jest.fn(async (_id, _expectedUpdatedAt, data) => {
        current = { ...current, ...data };
        return current;
      }),
      findProjectTask: jest.fn(async () => task),
      createProjectTask: jest.fn().mockResolvedValue({ id: 'new-task' }),
      updateProjectTask: jest.fn().mockResolvedValue(task),
      findProjectTaskMaterialAllocation: jest.fn(async () => allocation),
      createProjectTaskMaterialAllocation: jest.fn(async (data) => {
        allocation = { id: 'allocation-1', ...data };
        return allocation;
      }),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
    };
    return {
      repository,
      service: new ProjectCommandService(repository as never),
      outbox,
      tx,
      current: () => current,
    };
  }

  it('enforces project and task lifecycle transitions', () => {
    const planning = ProjectAggregate.hydrate({
      id: 'project-1',
      status: ProjectStatus.PLANNING,
      version: 1,
      taskStatuses: [],
      hasAcceptance: false,
    });
    expect(planning.activate()).toBe(ProjectStatus.ACTIVE);
    const activeWithoutAcceptance = ProjectAggregate.hydrate({
      id: 'project-1',
      status: ProjectStatus.ACTIVE,
      version: 2,
      taskStatuses: [ProjectTaskStatus.COMPLETED],
      hasAcceptance: false,
    });
    expect(() => activeWithoutAcceptance.complete()).toThrow(
      'requires acceptance',
    );

    const task = ProjectTaskAggregate.hydrate({
      id: 'task-1',
      projectId: 'project-1',
      status: ProjectTaskStatus.PLANNED,
    });
    expect(task.transition(ProjectTaskStatus.READY)).toBe(
      ProjectTaskStatus.READY,
    );
    expect(() => task.transition(ProjectTaskStatus.COMPLETED)).toThrow(
      'cannot move',
    );
  });

  it('creates a Project-owned allocation and canonical fact atomically', async () => {
    const { repository, service, tx } = setup();
    await service.allocateMaterial({
      idempotencyKey: 'project-allocation-1',
      expectedVersion: baseTime.getTime(),
      projectId: 'project-1',
      taskId: 'task-1',
      materialId: 'material-1',
      quantity: 10,
      unit: 'kg',
      unitCost: 2,
    });

    expect(repository.createProjectTaskMaterialAllocation).toHaveBeenCalledWith(
      expect.objectContaining({
        inventoryItemId: 'material-1',
        plannedQty: 10,
        issuedQty: 0,
      }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'project.material.allocated',
        payload: expect.objectContaining({
          materialId: 'material-1',
          quantity: 10,
        }),
      }),
      tx,
    );
  });

  it('prevents duplicate allocation with a different command key', async () => {
    const { service, current } = setup();
    const first = {
      idempotencyKey: 'project-allocation-first',
      expectedVersion: baseTime.getTime(),
      projectId: 'project-1',
      taskId: 'task-1',
      materialId: 'material-1',
      quantity: 10,
      unit: 'kg',
    };
    await service.allocateMaterial(first);

    await expect(
      service.allocateMaterial({
        ...first,
        idempotencyKey: 'project-allocation-second',
        expectedVersion: current()!.updatedAt.getTime(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('replays allocation without duplicating persistence or Outbox', async () => {
    const { repository, service } = setup();
    const command = {
      idempotencyKey: 'project-allocation-replay',
      expectedVersion: baseTime.getTime(),
      projectId: 'project-1',
      taskId: 'task-1',
      materialId: 'material-1',
      quantity: 10,
      unit: 'kg',
    };
    await service.allocateMaterial(command);
    await service.allocateMaterial(command);

    expect(
      repository.createProjectTaskMaterialAllocation,
    ).toHaveBeenCalledTimes(1);
    expect(
      repository.createOutboxEvent.mock.calls.filter(
        ([data]) => data.eventName === 'project.material.allocated',
      ),
    ).toHaveLength(1);
  });

  it('requires dispatched then delivered facts before one site receipt', async () => {
    const { service, current } = setup();
    await service.trackDelivery({
      idempotencyKey: 'project-delivery-dispatched',
      expectedVersion: baseTime.getTime(),
      projectId: 'project-1',
      shipmentId: 'shipment-1',
      logisticsEventId: 'event-dispatched',
      status: 'DISPATCHED',
    });
    await service.trackDelivery({
      idempotencyKey: 'project-delivery-delivered',
      expectedVersion: current()!.updatedAt.getTime(),
      projectId: 'project-1',
      shipmentId: 'shipment-1',
      logisticsEventId: 'event-delivered',
      status: 'DELIVERED',
    });
    await service.recordSiteReceipt({
      idempotencyKey: 'project-site-receipt-1',
      expectedVersion: current()!.updatedAt.getTime(),
      projectId: 'project-1',
      shipmentId: 'shipment-1',
      logisticsDeliveryEventId: 'event-delivered',
      receiptId: 'receipt-1',
      receivedAt: new Date('2026-07-17T02:00:00.000Z'),
    });

    await expect(
      service.recordSiteReceipt({
        idempotencyKey: 'project-site-receipt-2',
        expectedVersion: current()!.updatedAt.getTime(),
        projectId: 'project-1',
        shipmentId: 'shipment-1',
        logisticsDeliveryEventId: 'event-delivered',
        receiptId: 'receipt-2',
        receivedAt: new Date('2026-07-17T03:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('publishes one canonical acceptance and then permits completion', async () => {
    const { repository, service, current, tx } = setup();
    await service.completeAcceptance({
      idempotencyKey: 'project-acceptance-1',
      expectedVersion: baseTime.getTime(),
      projectId: 'project-1',
      acceptanceId: 'acceptance-1',
      componentId: 'component-1',
      result: 'ACCEPTED',
      acceptedQuantity: 1,
      unit: 'ea',
    });

    expect(repository.createOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'project.acceptance.completed',
        payload: expect.objectContaining({
          acceptanceId: 'acceptance-1',
          result: 'ACCEPTED',
        }),
      }),
      tx,
    );
    const completed = await service.complete({
      idempotencyKey: 'project-complete-1',
      expectedVersion: current()!.updatedAt.getTime(),
      projectId: 'project-1',
    });
    expect(completed.status).toBe(ProjectStatus.COMPLETED);
  });

  it('does not permit completion from rejected acceptance evidence', async () => {
    const { service, current } = setup();
    await service.completeAcceptance({
      idempotencyKey: 'project-acceptance-rejected',
      expectedVersion: baseTime.getTime(),
      projectId: 'project-1',
      acceptanceId: 'acceptance-rejected',
      componentId: 'component-1',
      result: 'REJECTED',
    });

    await expect(
      service.complete({
        idempotencyKey: 'project-complete-rejected',
        expectedVersion: current()!.updatedAt.getTime(),
        projectId: 'project-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects site receipt before delivered tracking', async () => {
    const { service } = setup();
    await expect(
      service.recordSiteReceipt({
        idempotencyKey: 'project-site-receipt-invalid',
        expectedVersion: baseTime.getTime(),
        projectId: 'project-1',
        shipmentId: 'shipment-1',
        logisticsDeliveryEventId: 'event-delivered',
        receiptId: 'receipt-1',
        receivedAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns conflict and writes no audit when project CAS loses the race', async () => {
    const { repository, service } = setup();
    repository.updateVersioned.mockResolvedValue(null);

    await expect(
      service.activate({
        idempotencyKey: 'project-activate-stale',
        expectedVersion: baseTime.getTime(),
        projectId: 'project-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const planningSetup = setup(project(ProjectStatus.PLANNING));
    planningSetup.repository.updateVersioned.mockResolvedValue(null);
    await expect(
      planningSetup.service.activate({
        idempotencyKey: 'project-activate-cas',
        expectedVersion: baseTime.getTime(),
        projectId: 'project-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(planningSetup.repository.createActivityLog).not.toHaveBeenCalled();
  });
});
