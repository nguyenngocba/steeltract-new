import { YardSnapshotRepository } from './yard-snapshot.repository';

describe('YardSnapshotRepository', () => {
  it('reads and upserts persisted Yard domain snapshots through the repository', async () => {
    const dashboard = { id: 'dash-1', scopeKey: 'ALL' };
    const workspace = { id: 'workspace-1', scopeKey: 'ALL' };
    const prisma = {
      yardDashboardSnapshot: {
        findUnique: jest.fn().mockResolvedValue(dashboard),
      },
      yardWorkspaceSnapshot: {
        findUnique: jest.fn().mockResolvedValue(workspace),
      },
    };
    const repository = new YardSnapshotRepository(prisma as never);
    const date = new Date('2026-07-13T00:00:00.000Z');

    await expect(repository.findDashboardSnapshot(date)).resolves.toBe(dashboard);
    await expect(repository.findWorkspaceSnapshot()).resolves.toBe(workspace);

    const tx = {
      yardDashboardSnapshot: { upsert: jest.fn().mockResolvedValue(dashboard) },
      yardWorkspaceSnapshot: { upsert: jest.fn().mockResolvedValue(workspace) },
    };
    await repository.upsertDashboard(
      {
        scopeKey: 'ALL',
        snapshotDate: date,
        totalZones: 1,
        totalSlots: 2,
        occupiedSlots: 1,
        availableSlots: 1,
        activePlacementCount: 1,
        totalWeight: 2.5,
        movementToday: 1,
        movementMonth: 3,
        overloadedZoneCount: 0,
        craneCount: 1,
        availableCraneCount: 1,
      },
      tx as never,
    );
    await repository.upsertWorkspace(
      {
        scopeKey: 'ALL',
        totalSlots: 2,
        occupiedSlots: 1,
        availableSlots: 1,
        placementCount: 1,
        totalWeight: 2.5,
      },
      tx as never,
    );

    expect(tx.yardDashboardSnapshot.upsert).toHaveBeenCalledTimes(1);
    expect(tx.yardWorkspaceSnapshot.upsert).toHaveBeenCalledTimes(1);
  });
});
