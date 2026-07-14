import { ProductionRepository } from './production.repository';

describe('ProductionRepository cockpit read model', () => {
  it('returns repository-owned summary and paginated order enrichment', async () => {
    const order = {
      id: 'order-1',
      orderNo: 'MO-001',
      title: 'Column A',
      quantity: 2,
      status: 'IN_PROGRESS',
      currentStageCode: 'WELDING',
      plannedEndAt: null,
      component: { id: 'component-1', code: 'C-001', name: 'Column A' },
      bom: {
        estimatedWeight: 50,
        items: [{ materialId: 'steel-1', quantity: 10, wastePercent: 0 }],
      },
      stages: [
        { name: 'Cutting', status: 'COMPLETED' },
        { name: 'Welding', status: 'IN_PROGRESS' },
      ],
      materialIssues: [
        {
          inventoryItemId: 'steel-1',
          issuedQty: 15,
          returnedQty: 0,
          status: 'ISSUED',
        },
      ],
      materialReservations: [{ status: 'PARTIALLY_ISSUED' }],
    };
    const prisma = {
      productionOrder: {
        findMany: jest.fn().mockResolvedValueOnce([order]).mockResolvedValueOnce([order]),
        count: jest.fn().mockResolvedValue(1),
      },
      workCenter: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const repository = new ProductionRepository(prisma as never);

    const result = await repository.cockpitReadModel({
      scope: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      page: 1,
      limit: 14,
    });

    expect(prisma.productionOrder.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ skip: 0, take: 14 }),
    );
    expect(result.meta).toEqual({ page: 1, limit: 14, total: 1, totalPages: 1 });
    expect(result.summary).toEqual(
      expect.objectContaining({
        total: 1,
        inProgress: 1,
        runningComponents: 1,
        productionWeight: 100,
      }),
    );
    expect(result.data[0].cockpit.materialReadiness).toEqual(
      expect.objectContaining({
        requiredQty: 20,
        issuedQty: 15,
        remainingQty: 5,
        readinessPercent: 75,
      }),
    );
  });
});
