import { snapshotEventMap } from '../events/event-consumer.service';
import { SnapshotWriterService } from './snapshot-writer.service';

describe('Yard snapshot writer integration', () => {
  it('writes dashboard and workspace rows in the shared snapshot transaction', async () => {
    const tx = {};
    const prisma = { $transaction: jest.fn(async (callback) => callback(tx)) };
    const metrics = {
      recordSnapshotRebuild: jest.fn(),
      recordSnapshotLag: jest.fn(),
    };
    const yard = {
      calculateDashboard: jest.fn().mockResolvedValue([{ scopeKey: 'ALL' }]),
      calculateWorkspaceSnapshots: jest.fn().mockResolvedValue([
        { scopeKey: 'ALL' },
        { scopeKey: 'ZONE:z1' },
      ]),
      upsertDashboard: jest.fn().mockResolvedValue({}),
      upsertWorkspace: jest.fn().mockResolvedValue({}),
    };
    const writer = new SnapshotWriterService(
      prisma as never,
      metrics as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      yard as never,
    );

    const result = await writer.rebuild({
      scope: { module: 'yard', snapshotType: 'YardWorkspaceSnapshot' },
      reason: 'domain-event',
    });

    expect(yard.upsertDashboard).toHaveBeenCalledWith(
      { scopeKey: 'ALL' },
      tx,
    );
    expect(yard.upsertWorkspace).toHaveBeenCalledTimes(2);
    expect(result).toEqual(expect.objectContaining({ rowsWritten: 3 }));
  });

  it('routes every existing Yard domain event to the Yard snapshot engine', () => {
    expect(snapshotEventMap).toEqual(
      expect.objectContaining({
        'yard.item.placed': expect.objectContaining({ module: 'yard' }),
        'yard.item.moved': expect.objectContaining({ module: 'yard' }),
        'yard.item.removed': expect.objectContaining({ module: 'yard' }),
        'yard.zone.updated': expect.objectContaining({ module: 'yard' }),
        'yard.snapshot.generated': expect.objectContaining({ module: 'yard' }),
      }),
    );
  });
});
