import { OutboxService } from './outbox.service';

describe('OutboxService', () => {
  it('claims a bounded batch through one atomic SQL statement', async () => {
    const rows = [{ id: 'outbox-1' }];
    const queryRaw = jest.fn().mockResolvedValue(rows);
    const service = new OutboxService({ $queryRaw: queryRaw } as never);

    await expect(service.claimDue(5_000, 'worker-1')).resolves.toBe(rows);

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(queryRaw).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Date),
      500,
      'worker-1',
    );
  });

  it('renews and completes only the current lease owner', async () => {
    const updateMany = jest
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    const service = new OutboxService({
      outboxEvent: { updateMany },
    } as never);

    await expect(service.renewLease('outbox-1', 'worker-1')).resolves.toBe(
      true,
    );
    await expect(service.markDispatched('outbox-1', 'worker-2')).resolves.toBe(
      false,
    );

    expect(updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ lockedBy: 'worker-1' }),
      }),
    );
    expect(updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({ lockedBy: 'worker-2' }),
      }),
    );
  });
});
