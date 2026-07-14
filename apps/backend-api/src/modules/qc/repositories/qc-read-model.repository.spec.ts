import { QcReadModelRepository } from './qc-read-model.repository';

describe('QcReadModelRepository', () => {
  it('returns bounded workspace metadata and real repository trend buckets', async () => {
    const prisma = {
      qcInspection: {
        findMany: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      qcIssue: {
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      nonConformanceReport: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      qcChecklist: { findMany: jest.fn().mockResolvedValue([]) },
      productionOrder: { findMany: jest.fn().mockResolvedValue([]) },
      component: { findMany: jest.fn().mockResolvedValue([]) },
      project: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([
        { date: '2026-07-13', total: 2, passed: 1, failed: 1 },
      ]),
    };
    const repository = new QcReadModelRepository(prisma as never);

    const result = await repository.workspace({
      page: 1,
      limit: 50,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });

    expect(result.meta).toEqual({
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 1,
    });
    expect(result.metrics).toEqual(
      expect.objectContaining({
        total: 0,
        pending: 0,
        passed: 0,
        waitingProductionOrders: 0,
      }),
    );
    expect(result.trend).toEqual([
      { date: '2026-07-13', total: 2, passed: 1, failed: 1 },
    ]);
    expect(prisma.qcInspection.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ skip: 0, take: 50 }),
    );
  });
});
