import { JobWorkerService } from './job-worker.service';

describe('JobWorkerService projection dispatch', () => {
  function createWorker(
    projectionProcess: jest.Mock,
    prisma: Record<string, unknown> = {},
  ) {
    const eventBus = { emit: jest.fn().mockResolvedValue(undefined) };
    const outbox = {
      renewLease: jest.fn().mockResolvedValue(true),
      markDispatched: jest.fn().mockResolvedValue(true),
      markFailed: jest.fn().mockResolvedValue(true),
    };
    const worker = new JobWorkerService(
      prisma as never,
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
    expect(outbox.renewLease).toHaveBeenCalledWith(
      event.id,
      expect.stringMatching(/^[^:]+:\d+:[0-9a-f-]+$/),
    );
    expect(outbox.markDispatched).toHaveBeenCalledWith(
      event.id,
      expect.stringMatching(/^[^:]+:\d+:[0-9a-f-]+$/),
    );
  });

  it('keeps the Outbox event retryable when projection processing fails', async () => {
    const error = new Error('projection failed');
    const projectionProcess = jest.fn().mockRejectedValue(error);
    const { worker, eventBus, outbox } = createWorker(projectionProcess);

    await (worker as any).dispatchOutboxEvent(event);

    expect(eventBus.emit).not.toHaveBeenCalled();
    expect(outbox.markDispatched).not.toHaveBeenCalled();
    expect(outbox.markFailed).toHaveBeenCalledWith(
      event.id,
      error,
      expect.stringMatching(/^[^:]+:\d+:[0-9a-f-]+$/),
    );
  });

  it('does not dispatch after losing Outbox lease ownership', async () => {
    const projectionProcess = jest.fn().mockResolvedValue(undefined);
    const { worker, eventBus, outbox } = createWorker(projectionProcess);
    outbox.renewLease.mockResolvedValue(false);

    await (worker as any).dispatchOutboxEvent(event);

    expect(projectionProcess).not.toHaveBeenCalled();
    expect(eventBus.emit).not.toHaveBeenCalled();
    expect(outbox.markDispatched).not.toHaveBeenCalled();
    expect(outbox.markFailed).toHaveBeenCalledWith(
      event.id,
      expect.objectContaining({ name: 'LeaseOwnershipError' }),
      expect.any(String),
    );
  });

  it('claims stale jobs with an atomic bounded lease takeover', async () => {
    const queryRaw = jest.fn().mockResolvedValue([]);
    const { worker } = createWorker(jest.fn(), { $queryRaw: queryRaw });

    await (worker as any).claimDueJobs(5_000);

    expect(queryRaw).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Date),
      500,
      expect.stringMatching(/^[^:]+:\d+:[0-9a-f-]+$/),
    );
  });

  it('renews a job lease only for the current worker owner', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const { worker } = createWorker(jest.fn(), {
      backgroundJob: { updateMany },
    });

    await expect((worker as any).renewJobLease('job-1')).resolves.toBe(false);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'job-1',
          status: 'RUNNING',
          lockedBy: expect.stringMatching(/^[^:]+:\d+:[0-9a-f-]+$/),
        }),
      }),
    );
  });

  it('coalesces overlapping worker ticks into one active execution', async () => {
    const { worker } = createWorker(jest.fn());
    let releaseDispatch: (() => void) | undefined;
    const dispatch = jest.spyOn(worker, 'dispatchOutbox').mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          releaseDispatch = () => resolve(0);
        }),
    );
    const jobs = jest.spyOn(worker, 'processDueJobs').mockResolvedValue(0);

    const first = worker.tick();
    const second = worker.tick();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(jobs).not.toHaveBeenCalled();

    releaseDispatch?.();
    await Promise.all([first, second]);

    expect(jobs).toHaveBeenCalledTimes(1);
  });

  it('waits for the active tick during module shutdown', async () => {
    const { worker } = createWorker(jest.fn());
    let releaseDispatch: (() => void) | undefined;
    jest.spyOn(worker, 'dispatchOutbox').mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          releaseDispatch = () => resolve(0);
        }),
    );
    jest.spyOn(worker, 'processDueJobs').mockResolvedValue(0);

    void worker.tick();
    let destroyed = false;
    const shutdown = worker.onModuleDestroy().then(() => {
      destroyed = true;
    });
    await Promise.resolve();
    expect(destroyed).toBe(false);

    releaseDispatch?.();
    await shutdown;

    await worker.tick();
    expect(worker.dispatchOutbox).toHaveBeenCalledTimes(1);
  });
});
