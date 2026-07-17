import { ProjectionEngineService } from './projection-engine.service';
import { ProjectionRegistryService } from './projection-registry.service';

describe('ProjectionEngineService', () => {
  it('records the failing projection and propagates the error to Outbox', async () => {
    const repository = {
      apply: jest.fn().mockRejectedValue(new Error('write failed')),
      recordFailure: jest.fn().mockResolvedValue(undefined),
    };
    const engine = new ProjectionEngineService(
      new ProjectionRegistryService(),
      repository as never,
    );
    const event = {
      id: 'outbox-1',
      eventName: 'component.created',
      payload: { componentId: 'component-1', state: 'DRAFT' },
      metadata: { eventId: 'event-1' },
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 5,
    };

    await expect(engine.process(event)).rejects.toThrow('write failed');
    expect(repository.recordFailure).toHaveBeenCalledWith(
      'ComponentSummary',
      event,
      expect.any(Error),
    );
  });
});
