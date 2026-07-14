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
});
