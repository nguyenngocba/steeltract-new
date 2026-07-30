import { ComponentStatus } from '@prisma/client';

import { ComponentSnapshotRepository } from './component-snapshot.repository';

describe('ComponentSnapshotRepository', () => {
  const prisma = {
    component: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    componentTimeline: { groupBy: jest.fn() },
    yardItemPlacement: { findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.component.groupBy.mockResolvedValue([
      { status: ComponentStatus.STOCK, _count: 2 },
      { status: ComponentStatus.READY, _count: 1 },
    ]);
    prisma.component.aggregate.mockResolvedValue({
      _sum: { estimatedCost: 120, actualCost: 100 },
    });
    prisma.componentTimeline.groupBy.mockResolvedValue([
      { action: 'READY', _count: 1 },
    ]);
    prisma.component.findMany.mockResolvedValue([]);
    prisma.yardItemPlacement.findMany.mockResolvedValue([]);
  });

  it('calculates a domain dashboard snapshot from live component data', async () => {
    const repository = new ComponentSnapshotRepository(prisma as never);

    const rows = await repository.calculateDashboard(
      new Date('2026-07-12T10:00:00.000Z'),
    );

    expect(rows).toEqual([
      expect.objectContaining({
        scopeKey: 'ALL',
        totalComponents: 3,
        stockCount: 2,
        readyCount: 1,
        totalEstimatedCost: 120,
        totalActualCost: 100,
      }),
    ]);
  });

  it('resolves canonical Yard placement by ComponentInstance componentId before legacy itemId fallback', async () => {
    prisma.component.findMany.mockResolvedValue([
      {
        id: 'component-1',
        code: 'C-1',
        name: 'Beam 1',
        status: ComponentStatus.STOCK,
        projectId: 'project-1',
        estimatedCost: 0,
        actualCost: 0,
        floor: null,
        zone: null,
        position: null,
        installedDate: null,
        installZone: null,
        installAxis: null,
        installLevel: null,
        installPosition: null,
        project: null,
        _count: { productionOrders: 0, timelines: 0 },
      },
    ]);
    prisma.yardItemPlacement.findMany.mockResolvedValue([
      {
        itemId: 'component-instance-1',
        stackLevel: 2,
        componentInstance: {
          id: 'component-instance-1',
          instanceNo: 'CI-001',
          componentId: 'component-1',
        },
        slot: { code: 'A01', zone: { code: 'YA' } },
      },
    ]);
    const repository = new ComponentSnapshotRepository(prisma as never);

    const rows = await repository.calculateSummarySnapshots('component-1');

    expect(prisma.yardItemPlacement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              componentInstance: {
                componentId: { in: ['component-1'] },
              },
            }),
          ]),
        }),
      }),
    );
    expect(rows[0]).toEqual(
      expect.objectContaining({
        componentId: 'component-1',
        currentLocation: 'YA / A01 / L2',
      }),
    );
  });
});
