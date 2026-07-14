import { ComponentsReadModelRepository } from './components-read-model.repository';

describe('ComponentsReadModelRepository', () => {
  const component = {
    id: 'component-1',
    code: 'CK-001',
    name: 'Beam A',
    description: JSON.stringify({
      type: 'Dầm (Beam)',
      profile: 'H300',
      quantity: 2,
      qcQuantity: 1,
    }),
    projectId: null,
    floor: 'Kho cấu kiện',
    zone: null,
    position: null,
    installZone: null,
    installAxis: null,
    installLevel: null,
    installPosition: null,
    status: 'STOCK',
    createdAt: new Date('2026-07-12T00:00:00.000Z'),
    project: null,
    productionOrders: [],
  };
  const prisma = {
    component: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    bOM: { findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.component.findMany.mockResolvedValue([component]);
    prisma.component.count.mockResolvedValue(1);
    prisma.bOM.findMany.mockResolvedValue([]);
  });

  it('returns bounded rows with server-owned summary and pagination metadata', async () => {
    const repository = new ComponentsReadModelRepository(prisma as never);
    jest
      .spyOn(repository as never, 'listSummaryFromDb' as never)
      .mockResolvedValue({
        total: 1,
        running: 0,
        completed: 0,
        waitingMaterial: 0,
        delayed: 0,
        weight: 0,
      } as never);
    jest
      .spyOn(repository as never, 'listAnalyticsFromDb' as never)
      .mockResolvedValue({
        topWeight: [],
        delayedRows: [],
        materialShortage: [],
        structure: [],
        newestComponents: [],
        activitySeries: [],
        projectDistribution: [],
      } as never);

    const result = await repository.list({ page: 1, limit: 14 });

    expect(result.meta).toEqual({
      page: 1,
      limit: 14,
      total: 1,
      totalPages: 1,
    });
    expect(result.data).toEqual([
      expect.objectContaining({
        id: 'component-1',
        type: 'Dầm (Beam)',
        profile: 'H300',
        qty: 2,
        status: 'Tồn kho',
      }),
    ]);
    expect(result.summary).toEqual(
      expect.objectContaining({ total: 1, running: 0, completed: 0 }),
    );
    expect(prisma.component.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ skip: 0, take: 14 }),
    );
  });
});
