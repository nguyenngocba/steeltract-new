import { SnapshotWriterService } from './snapshot-writer.service';

describe('SnapshotWriterService Components routing', () => {
  it('writes dashboard and summary snapshots in one background transaction', async () => {
    const tx = { id: 'snapshot-tx' };
    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const metrics = {
      recordSnapshotRebuild: jest.fn(),
      recordSnapshotLag: jest.fn(),
    };
    const components = {
      calculateDashboard: jest.fn().mockResolvedValue([{ scopeKey: 'ALL' }]),
      calculateSummarySnapshots: jest
        .fn()
        .mockResolvedValue([{ componentId: 'component-1' }]),
      upsertDashboard: jest.fn().mockResolvedValue({}),
      upsertSummary: jest.fn().mockResolvedValue({}),
    };
    const service = new SnapshotWriterService(
      prisma as never,
      metrics as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      components as never,
      {} as never,
    );

    const result = await service.rebuild({
      scope: {
        module: 'components',
        snapshotType: 'ComponentSummarySnapshot',
        componentId: 'component-1',
      },
      reason: 'domain-event',
    });

    expect(components.calculateSummarySnapshots).toHaveBeenCalledWith(
      'component-1',
    );
    expect(components.upsertDashboard).toHaveBeenCalledWith(
      { scopeKey: 'ALL' },
      tx,
    );
    expect(components.upsertSummary).toHaveBeenCalledWith(
      { componentId: 'component-1' },
      tx,
    );
    expect(result).toEqual(
      expect.objectContaining({
        module: 'components',
        scopeId: 'component-1',
        rowsRead: 2,
        rowsWritten: 2,
      }),
    );
  });
});
