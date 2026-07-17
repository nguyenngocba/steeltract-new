import { JobWorkerService } from './job-worker.service';

describe('JobWorkerService projection dispatch', () => {
  function createWorker(projectionProcess: jest.Mock) {
    const eventBus = { emit: jest.fn().mockResolvedValue(undefined) };
    const outbox = {
      markDispatched: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };
    const worker = new JobWorkerService(
      {} as never,
      eventBus as never,
      outbox as never,
      {} as never,
      {} as never,
      {} as never,
      { process: projectionProcess } as never,
    );

    return { worker, eventBus, outbox };
  }

  const event = {
    id: 'outbox-1',
    eventName: 'production.order.started',
    payload: { productionOrderId: 'order-1' },
    metadata: { eventId: 'event-1' },
  };

  it('projects before publishing and marking an Outbox event dispatched', async () => {
    const projectionProcess = jest.fn().mockResolvedValue(undefined);
    const { worker, eventBus, outbox } = createWorker(projectionProcess);

    await (worker as any).dispatchOutboxEvent(event);

    expect(projectionProcess).toHaveBeenCalledWith(event);
    expect(projectionProcess.mock.invocationCallOrder[0]).toBeLessThan(
      eventBus.emit.mock.invocationCallOrder[0],
    );
    expect(eventBus.emit.mock.invocationCallOrder[0]).toBeLessThan(
      outbox.markDispatched.mock.invocationCallOrder[0],
    );
  });

  it('keeps the Outbox event retryable when projection processing fails', async () => {
    const error = new Error('projection failed');
    const projectionProcess = jest.fn().mockRejectedValue(error);
    const { worker, eventBus, outbox } = createWorker(projectionProcess);

    await (worker as any).dispatchOutboxEvent(event);

    expect(eventBus.emit).not.toHaveBeenCalled();
    expect(outbox.markDispatched).not.toHaveBeenCalled();
    expect(outbox.markFailed).toHaveBeenCalledWith(event.id, error);
  });
});
