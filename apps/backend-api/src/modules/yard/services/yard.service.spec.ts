import { YardService } from './yard.service';

describe('YardService repository and Outbox boundary', () => {
  const zone = {
    id: 'zone-1',
    code: 'Y-A',
    name: 'Yard A',
    slots: [],
  };

  function setup(outboxError?: Error) {
    const tx = { transaction: 'yard-tx' };
    const repository = {
      transaction: jest.fn(async (callback) => callback(tx)),
      createZone: jest.fn().mockResolvedValue(zone),
      createActivityLog: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      createOutboxEvent: outboxError
        ? jest.fn().mockRejectedValue(outboxError)
        : jest.fn().mockResolvedValue({ id: 'outbox-1' }),
    };
    const service = new YardService(
      repository as never,
      { link: jest.fn() } as never,
    );

    return { repository, service, tx };
  }

  it('writes business data, ActivityLog and both Outbox rows with one transaction client', async () => {
    const { repository, service, tx } = setup();

    await expect(
      service.createZone(
        {
          code: 'Y-A',
          name: 'Yard A',
          status: 'ACTIVE',
          originX: 0,
          originY: 0,
          width: 0,
          height: 0,
          color: '#06b6d4',
        },
        'user-1',
      ),
    ).resolves.toBe(zone);

    expect(repository.createZone).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'Y-A' }),
      tx,
    );
    expect(repository.createActivityLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'YARD_ZONE_CREATED' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ eventName: 'audit.activity.created' }),
      tx,
    );
    expect(repository.createOutboxEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ eventName: 'yard.zone.updated' }),
      tx,
    );
  });

  it('rejects the mutation result when atomic Outbox persistence fails', async () => {
    const error = new Error('outbox unavailable');
    const { service } = setup(error);

    await expect(
      service.createZone({
        code: 'Y-A',
        name: 'Yard A',
        status: 'ACTIVE',
        originX: 0,
        originY: 0,
        width: 0,
        height: 0,
        color: '#06b6d4',
      }),
    ).rejects.toThrow('outbox unavailable');
  });
});
