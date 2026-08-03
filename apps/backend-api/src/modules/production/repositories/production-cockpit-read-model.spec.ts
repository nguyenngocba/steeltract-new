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
      componentRequirementId: 'requirement-1',
      projectId: 'project-1',
      updatedAt: new Date('2026-08-03T08:00:00.000Z'),
      componentRequirement: {
        id: 'requirement-1',
        requirementNo: 'REQ-001',
        requiredQuantity: 2,
        project: { id: 'project-1', code: 'PRJ-001', name: 'Factory A' },
        component: {
          id: 'component-1',
          code: 'C-001',
          name: 'Column A',
          componentType: 'COLUMN',
          profile: 'H300',
          lifecycleState: 'ACTIVE',
        },
        componentRevision: {
          id: 'revision-1',
          revisionNo: 'R1',
          state: 'RELEASED',
        },
        bomDefinition: {
          id: 'bom-definition-1',
          state: 'RELEASED',
          contentHash: 'hash-1',
        },
      },
      bom: {
        id: 'bom-1',
        bomNo: 'BOM-001',
        productCode: 'C-001',
        version: '1',
        status: 'ACTIVE',
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
      componentInstances: [
        {
          id: 'instance-1',
          instanceNo: 'CI-001',
          state: 'QC_PASSED',
          producedAt: new Date('2026-08-03T07:00:00.000Z'),
          qcPassedAt: new Date('2026-08-03T07:40:00.000Z'),
          scrappedAt: null,
          updatedAt: new Date('2026-08-03T08:00:00.000Z'),
          executions: [
            {
              id: 'execution-1',
              status: 'COMPLETED',
              startedAt: new Date('2026-08-03T06:00:00.000Z'),
              completedAt: new Date('2026-08-03T07:00:00.000Z'),
              cancelledAt: null,
              updatedAt: new Date('2026-08-03T07:00:00.000Z'),
            },
          ],
          qcInspections: [
            {
              id: 'qc-1',
              inspectionNo: 'QC-001',
              status: 'PASSED',
              completedAt: new Date('2026-08-03T07:30:00.000Z'),
              approvedAt: null,
              rejectedAt: null,
              updatedAt: new Date('2026-08-03T07:30:00.000Z'),
            },
          ],
          ncrs: [],
        },
        {
          id: 'instance-2',
          instanceNo: 'CI-002',
          state: 'PRODUCED_WAITING_QC',
          producedAt: new Date('2026-08-03T07:10:00.000Z'),
          qcPassedAt: null,
          scrappedAt: null,
          updatedAt: new Date('2026-08-03T08:10:00.000Z'),
          executions: [],
          qcInspections: [],
          ncrs: [],
        },
      ],
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
        componentInstances: 2,
        waitingQc: 1,
        qcPassed: 1,
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
    expect(result.data[0].canonical).toEqual(
      expect.objectContaining({
        plannedQuantity: 2,
        componentInstances: expect.objectContaining({ total: 2 }),
        execution: expect.objectContaining({ completed: 1 }),
        qc: expect.objectContaining({ passed: 1 }),
      }),
    );
    expect(result.data[0].canonical.project).toEqual(
      expect.objectContaining({ code: 'PRJ-001' }),
    );
  });
});
