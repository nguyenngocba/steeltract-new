import { ProjectionReplayService } from './projection-replay.service';
import { ProjectionRegistryService } from './projection-registry.service';

describe('ProjectionReplayService', () => {
  it('resumes from durable Outbox history and skips unrelated events', async () => {
    const events = [
      {
        id: 'outbox-1',
        eventName: 'production.order.started',
        payload: { productionOrderId: 'order-1' },
        metadata: {},
        createdAt: new Date('2026-07-17T00:00:00.000Z'),
        retryCount: 0,
        maxRetries: 5,
      },
      {
        id: 'outbox-2',
        eventName: 'component.created',
        payload: { componentId: 'component-1' },
        metadata: {},
        createdAt: new Date('2026-07-17T00:00:01.000Z'),
        retryCount: 0,
        maxRetries: 5,
      },
    ];
    const repository = {
      outboxPage: jest.fn().mockResolvedValue(events),
      replayCursor: jest.fn().mockResolvedValue(undefined),
      advanceReplayCursor: jest.fn().mockResolvedValue(undefined),
      reset: jest.fn().mockResolvedValue(undefined),
    };
    const engine = {
      processProjection: jest.fn(async (_name, event) =>
        event.eventName.startsWith('production.order.')
          ? { applied: true, replay: false }
          : { applied: false, ignored: true },
      ),
    };
    const replay = new ProjectionReplayService(
      new ProjectionRegistryService(),
      repository as never,
      engine as never,
    );

    await expect(replay.resume('ProductionOrderSummary')).resolves.toEqual({
      projectionName: 'ProductionOrderSummary',
      scanned: 2,
      matched: 1,
      truncated: false,
      cursor: {
        createdAt: new Date('2026-07-17T00:00:01.000Z'),
        id: 'outbox-2',
      },
    });
    expect(repository.advanceReplayCursor).toHaveBeenCalledWith(
      'ProductionOrderSummary',
      events[1],
      1,
    );
    await replay.rebuild('ProductionOrderSummary');
    expect(repository.reset).toHaveBeenCalledWith('ProductionOrderSummary');
  });

  it('starts at the durable checkpoint and bounds work per invocation', async () => {
    const cursor = {
      createdAt: new Date('2026-07-17T00:00:00.000Z'),
      id: 'outbox-0',
    };
    const events = Array.from({ length: 10 }, (_, index) => ({
      id: `outbox-${index + 1}`,
      eventName: 'production.order.started',
      payload: { productionOrderId: `order-${index + 1}` },
      metadata: {},
      createdAt: new Date(
        `2026-07-17T00:00:${String(index + 1).padStart(2, '0')}.000Z`,
      ),
      retryCount: 0,
      maxRetries: 5,
    }));
    const repository = {
      outboxPage: jest.fn().mockResolvedValue(events),
      replayCursor: jest.fn().mockResolvedValue(cursor),
      advanceReplayCursor: jest.fn(),
      reset: jest.fn(),
    };
    const engine = {
      processProjection: jest
        .fn()
        .mockResolvedValue({ applied: true, replay: false }),
    };
    const replay = new ProjectionReplayService(
      new ProjectionRegistryService(),
      repository as never,
      engine as never,
    );

    const result = await replay.resume('ProductionOrderSummary', {
      batchSize: 10,
      maxEvents: 10,
    });
    expect(repository.outboxPage).toHaveBeenCalledWith(cursor, 10);
    expect(repository.advanceReplayCursor).toHaveBeenCalledTimes(1);
    expect(repository.advanceReplayCursor).toHaveBeenCalledWith(
      'ProductionOrderSummary',
      events[9],
      1,
    );
    expect(result).toEqual(
      expect.objectContaining({ scanned: 10, matched: 10, truncated: true }),
    );
  });
});
