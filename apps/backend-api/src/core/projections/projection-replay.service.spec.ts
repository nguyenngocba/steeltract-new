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
    });
    await replay.rebuild('ProductionOrderSummary');
    expect(repository.reset).toHaveBeenCalledWith('ProductionOrderSummary');
  });
});
