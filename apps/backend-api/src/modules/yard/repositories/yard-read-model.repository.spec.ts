import { YardReadModelRepository } from './yard-read-model.repository';

describe('YardReadModelRepository', () => {
  it('returns bounded rows with server-owned totals and real empty QC queue', async () => {
    const prisma = {
      yardZone: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ id: 'z1', code: 'A', name: 'A', slots: [] }])
          .mockResolvedValueOnce([
            {
              id: 'z1',
              code: 'A',
              name: 'A',
              slots: [{ status: 'OCCUPIED' }, { status: 'AVAILABLE' }],
            },
          ]),
        count: jest.fn().mockResolvedValue(1),
      },
      yardSlot: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 's1',
            code: 'A01',
            status: 'OCCUPIED',
            zone: { id: 'z1', code: 'A', name: 'A' },
            placements: [],
          },
        ]),
        count: jest.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1),
      },
      yardItemPlacement: {
        count: jest.fn().mockResolvedValue(5),
        aggregate: jest.fn().mockResolvedValue({ _sum: { weight: 12.5 } }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      yardMovement: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValueOnce(250).mockResolvedValueOnce(7),
        groupBy: jest.fn().mockResolvedValue([
          { type: 'PLACE', _count: 30 },
          { type: 'MOVE', _count: 20 },
          { type: 'REMOVE', _count: 10 },
        ]),
      },
      crane: { findMany: jest.fn().mockResolvedValue([]) },
      qcInspection: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([{ day: '2026-07-13', count: 7 }]),
    };
    const repository = new YardReadModelRepository(prisma as never);

    const result = await repository.workspace({
      page: 1,
      limit: 100,
      movementPage: 2,
      movementLimit: 30,
      sortBy: 'code',
      sortOrder: 'asc',
    });

    expect(prisma.yardSlot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 100 }),
    );
    expect(prisma.yardMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 30, take: 30 }),
    );
    expect(result.summary).toEqual(
      expect.objectContaining({
        totalSlots: 2,
        occupiedSlots: 1,
        availableSlots: 1,
        placements: 5,
        totalWeight: 12.5,
        movementsToday: 7,
      }),
    );
    expect(result.analytics.movementCounts).toEqual(
      expect.objectContaining({ place: 30, move: 20, remove: 10 }),
    );
    expect(result.meta.movements).toEqual(
      expect.objectContaining({ page: 2, total: 250, totalPages: 9 }),
    );
    expect(result.qcQueue).toEqual([]);
  });
});
