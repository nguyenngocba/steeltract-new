import { Injectable } from '@nestjs/common';

import { SnapshotUpdateDispatcher } from '../../../core/jobs/snapshot-update-dispatcher.service';
import { PerformanceMetricsService } from '../../../core/performance/performance-metrics.service';
import { DashboardReaderService } from '../../../core/snapshots/dashboard-reader.service';
import type { SnapshotComparisonWarning } from '../../../core/snapshots/dashboard-reader.types';
import { SnapshotReaderService } from '../../../core/snapshots/snapshot-reader.service';
import { YardReadModelRepository } from '../repositories/yard-read-model.repository';

type YardDashboardRead = {
  scopeKey: string;
  snapshotDate: Date;
  totalZones: number;
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  activePlacementCount: number;
  totalWeight: number;
  movementToday: number;
  movementMonth: number;
  overloadedZoneCount: number;
  craneCount: number;
  availableCraneCount: number;
  payload: unknown;
};

@Injectable()
export class YardSnapshotReadService {
  constructor(
    private readonly dashboardReader: DashboardReaderService,
    private readonly snapshotReader: SnapshotReaderService,
    private readonly liveReadModel: YardReadModelRepository,
    private readonly dispatcher: SnapshotUpdateDispatcher,
    private readonly metrics: PerformanceMetricsService,
  ) {}

  async dashboard(snapshotDate = new Date()) {
    const day = this.startOfDay(snapshotDate);
    const result = await this.dashboardReader.read({
      module: 'yard',
      snapshotType: 'YardDashboardSnapshot',
      loadSnapshot: async () => {
        const snapshot = await this.snapshotReader.yardDashboard(day);
        return snapshot
          ? { data: snapshot, updatedAt: snapshot.updatedAt, rowCount: 1 }
          : null;
      },
      readSnapshot: (snapshot) => this.dashboardShape(snapshot),
      readRuntime: async () => {
        const live = await this.liveReadModel.workspace(this.liveQuery());
        return this.liveDashboardShape(live, day);
      },
      compare: (snapshot, runtime) => this.compare(snapshot, runtime),
    });

    if (result.source === 'runtime') {
      this.metrics.recordYardFallback();
      void this.dispatcher.requestUpdate({
        scope: { module: 'yard', snapshotType: 'YardDashboardSnapshot' },
        reason:
          result.meta.fallbackReason === 'stale'
            ? 'stale-snapshot'
            : 'fallback-miss',
        priority: 60,
      });
    }
    if (result.source === 'snapshot') {
      this.metrics.recordYardReadModelHit();
    }

    return result;
  }

  async workspaceSummary(zoneId?: string) {
    const scopeKey = zoneId ? `ZONE:${zoneId}` : 'ALL';
    const snapshot = await this.snapshotReader.yardWorkspace(scopeKey);
    if (snapshot) {
      this.metrics.recordYardReadModelHit();
      return { data: snapshot, source: 'snapshot' as const };
    }

    const live = await this.liveReadModel.workspace({
      ...this.liveQuery(),
      zoneId,
    });
    this.metrics.recordYardFallback();
    void this.dispatcher.requestUpdate({
      scope: {
        module: 'yard',
        snapshotType: 'YardWorkspaceSnapshot',
        yardZoneId: zoneId,
      },
      reason: 'fallback-miss',
      priority: 60,
    });
    return {
      data: {
        scopeKey,
        zoneId: zoneId ?? null,
        totalSlots: live.summary.totalSlots,
        occupiedSlots: live.summary.occupiedSlots,
        availableSlots: live.summary.availableSlots,
        placementCount: live.summary.placements,
        totalWeight: live.summary.totalWeight,
        payload: { zoneUtilization: live.analytics.zoneUtilization },
      },
      source: 'runtime' as const,
    };
  }

  private liveQuery() {
    return {
      page: 1,
      limit: 1,
      movementPage: 1,
      movementLimit: 1,
      sortBy: 'code' as const,
      sortOrder: 'asc' as const,
    };
  }

  private dashboardShape(snapshot: {
    scopeKey: string;
    snapshotDate: Date;
    totalZones: number;
    totalSlots: number;
    occupiedSlots: number;
    availableSlots: number;
    activePlacementCount: number;
    totalWeight: number;
    movementToday: number;
    movementMonth: number;
    overloadedZoneCount: number;
    craneCount: number;
    availableCraneCount: number;
    payload?: unknown;
  }): YardDashboardRead {
    return { ...snapshot, payload: snapshot.payload ?? null };
  }

  private liveDashboardShape(
    live: Awaited<ReturnType<YardReadModelRepository['workspace']>>,
    snapshotDate: Date,
  ): YardDashboardRead {
    return {
      scopeKey: 'ALL',
      snapshotDate,
      totalZones: live.summary.zones,
      totalSlots: live.summary.totalSlots,
      occupiedSlots: live.summary.occupiedSlots,
      availableSlots: live.summary.availableSlots,
      activePlacementCount: live.summary.placements,
      totalWeight: live.summary.totalWeight,
      movementToday: live.summary.movementsToday,
      movementMonth: live.analytics.movementMonth,
      overloadedZoneCount: live.summary.overloadedZones,
      craneCount: live.cranes.length,
      availableCraneCount: live.analytics.craneAvailableCount,
      payload: {
        movementCounts: live.analytics.movementCounts,
        zoneUtilization: live.analytics.zoneUtilization,
      },
    };
  }

  private compare(
    snapshot: YardDashboardRead,
    runtime: YardDashboardRead,
  ): SnapshotComparisonWarning[] {
    const fields: Array<keyof YardDashboardRead> = [
      'totalZones',
      'totalSlots',
      'occupiedSlots',
      'availableSlots',
      'activePlacementCount',
      'totalWeight',
      'movementToday',
      'movementMonth',
      'overloadedZoneCount',
      'craneCount',
      'availableCraneCount',
    ];
    return fields.flatMap((field) => {
      const snapshotValue = Number(snapshot[field] ?? 0);
      const runtimeValue = Number(runtime[field] ?? 0);
      return Math.abs(snapshotValue - runtimeValue) <= 0.0001
        ? []
        : [{
            field: String(field),
            snapshotValue,
            runtimeValue,
            reason: 'VALUE_MISMATCH' as const,
          }];
    });
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
