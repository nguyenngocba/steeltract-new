import { QcSnapshotRepository } from './qc-snapshot.repository';

describe('QcSnapshotRepository', () => {
  it('calculates dashboard metrics from live QC data without synthetic rows', async () => {
    const prisma = {
      qcInspection: {
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      qcIssue: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      nonConformanceReport: { count: jest.fn().mockResolvedValue(0) },
      productionOrder: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'order-1', componentId: 'component-1' },
        ]),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    const repository = new QcSnapshotRepository(prisma as never);

    const rows = await repository.calculateDashboard(
      new Date('2026-07-13T10:00:00.000Z'),
    );

    expect(rows).toEqual([
      expect.objectContaining({
        scopeKey: 'ALL',
        totalInspections: 0,
        waitingProductionCount: 1,
        passRate: 0,
      }),
    ]);
    expect(rows[0].payload).toEqual({ defects: [], trend: [] });
  });
});
