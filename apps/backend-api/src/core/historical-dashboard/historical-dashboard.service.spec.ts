import { NotFoundException } from '@nestjs/common';
import {
  HistoricalDashboardModule,
  Prisma,
  SnapshotJobStatus,
} from '@prisma/client';

import { HistoricalDashboardService } from './historical-dashboard.service';

describe('HistoricalDashboardService', () => {
  const repository = () => ({
    findDashboardSnapshot: jest.fn(),
    findLatestDashboardSnapshot: jest.fn(),
    findDashboardMonthlyRollups: jest.fn(),
    findInventorySnapshots: jest.fn(),
    findInventoryMonthlyRollups: jest.fn(),
    findSnapshotJobs: jest.fn(),
  });

  it('returns a dashboard snapshot DTO for the requested date', async () => {
    const repo = repository();
    repo.findDashboardSnapshot.mockResolvedValue({
      id: 'snapshot-1',
      module: HistoricalDashboardModule.ERP,
      scopeKey: 'ALL',
      snapshotDate: new Date('2026-07-22T00:00:00.000Z'),
      generatedAt: new Date('2026-07-22T01:00:00.000Z'),
      authoritative: true,
      kpis: { inventoryValue: new Prisma.Decimal('158.26') },
      rowsRead: BigInt(12),
    });
    const service = new HistoricalDashboardService(repo as any);

    const result = await service.dashboard({
      date: '2026-07-22',
      module: HistoricalDashboardModule.ERP,
    });

    expect(repo.findDashboardSnapshot).toHaveBeenCalledWith({
      date: new Date('2026-07-22T00:00:00.000Z'),
      module: HistoricalDashboardModule.ERP,
      scopeKey: 'ALL',
      authoritative: undefined,
    });
    expect(result).toEqual({
      id: 'snapshot-1',
      module: HistoricalDashboardModule.ERP,
      scopeKey: 'ALL',
      snapshotDate: '2026-07-22',
      generatedAt: '2026-07-22T01:00:00.000Z',
      authoritative: true,
      kpis: { inventoryValue: '158.26' },
      rowsRead: '12',
    });
  });

  it('parses leap-day and year-boundary business date filters without timezone drift', async () => {
    const repo = repository();
    repo.findDashboardSnapshot.mockResolvedValue({
      id: 'snapshot-2',
      module: HistoricalDashboardModule.INVENTORY,
      scopeKey: 'ALL',
      snapshotDate: new Date('2024-02-29T00:00:00.000Z'),
      authoritative: true,
      kpis: {},
    });
    const service = new HistoricalDashboardService(repo as any);

    await service.dashboard({
      date: '2024-02-29',
      module: HistoricalDashboardModule.INVENTORY,
    });

    expect(repo.findDashboardSnapshot).toHaveBeenCalledWith({
      date: new Date('2024-02-29T00:00:00.000Z'),
      module: HistoricalDashboardModule.INVENTORY,
      scopeKey: 'ALL',
      authoritative: undefined,
    });

    repo.findDashboardSnapshot.mockResolvedValue({
      id: 'snapshot-3',
      module: HistoricalDashboardModule.PROJECTS,
      scopeKey: 'ALL',
      snapshotDate: new Date('2026-12-31T00:00:00.000Z'),
      authoritative: true,
      kpis: {},
    });

    await service.dashboard({
      date: '2026-12-31',
      module: HistoricalDashboardModule.PROJECTS,
    });

    expect(repo.findDashboardSnapshot).toHaveBeenLastCalledWith({
      date: new Date('2026-12-31T00:00:00.000Z'),
      module: HistoricalDashboardModule.PROJECTS,
      scopeKey: 'ALL',
      authoritative: undefined,
    });
  });

  it('throws not found when latest authoritative snapshot is missing', async () => {
    const repo = repository();
    repo.findLatestDashboardSnapshot.mockResolvedValue(null);
    const service = new HistoricalDashboardService(repo as any);

    await expect(
      service.latestDashboard({
        module: HistoricalDashboardModule.INVENTORY,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns paginated snapshot jobs without exposing BigInt values', async () => {
    const repo = repository();
    repo.findSnapshotJobs.mockResolvedValue({
      data: [
        {
          id: 'job-1',
          status: SnapshotJobStatus.COMPLETED,
          rowsRead: BigInt(150),
          rowsWritten: BigInt(20),
          createdAt: new Date('2026-07-22T01:00:00.000Z'),
        },
      ],
      total: 1,
    });
    const service = new HistoricalDashboardService(repo as any);

    const result = await service.jobs({
      status: SnapshotJobStatus.COMPLETED,
      page: 2,
      pageSize: 10,
    });

    expect(repo.findSnapshotJobs).toHaveBeenCalledWith({
      status: SnapshotJobStatus.COMPLETED,
      module: undefined,
      date: undefined,
      skip: 10,
      take: 10,
    });
    expect(result).toEqual({
      data: [
        {
          id: 'job-1',
          status: SnapshotJobStatus.COMPLETED,
          rowsRead: '150',
          rowsWritten: '20',
          createdAt: '2026-07-22T01:00:00.000Z',
        },
      ],
      meta: {
        page: 2,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });
});
