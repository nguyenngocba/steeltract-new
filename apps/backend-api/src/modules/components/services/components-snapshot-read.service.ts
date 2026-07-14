import { Injectable } from '@nestjs/common';

import { SnapshotUpdateDispatcher } from '../../../core/jobs/snapshot-update-dispatcher.service';
import { PerformanceMetricsService } from '../../../core/performance/performance-metrics.service';
import { DashboardReaderService } from '../../../core/snapshots/dashboard-reader.service';
import type { SnapshotComparisonWarning } from '../../../core/snapshots/dashboard-reader.types';
import { ComponentSnapshotRepository } from '../../../core/snapshots/component-snapshot.repository';
import { SnapshotReaderService } from '../../../core/snapshots/snapshot-reader.service';

type ComponentDashboardRead = {
  scopeKey: string;
  snapshotDate: Date;
  totalComponents: number;
  stockCount: number;
  producingCount: number;
  readyCount: number;
  shippedCount: number;
  deliveredCount: number;
  installedCount: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  payload: unknown;
};

@Injectable()
export class ComponentsSnapshotReadService {
  constructor(
    private readonly dashboardReader: DashboardReaderService,
    private readonly snapshotReader: SnapshotReaderService,
    private readonly snapshots: ComponentSnapshotRepository,
    private readonly dispatcher: SnapshotUpdateDispatcher,
    private readonly metrics: PerformanceMetricsService,
  ) {}

  async dashboard(snapshotDate = new Date()) {
    const day = this.startOfDay(snapshotDate);
    const result = await this.dashboardReader.read({
      module: 'components',
      snapshotType: 'ComponentDashboardSnapshot',
      loadSnapshot: async () => {
        const snapshot = await this.snapshotReader.componentsDashboard(day);
        return snapshot
          ? { data: snapshot, updatedAt: snapshot.updatedAt, rowCount: 1 }
          : null;
      },
      readSnapshot: (snapshot) => this.dashboardShape(snapshot),
      readRuntime: async () => {
        const rows = await this.snapshots.calculateDashboard(day);
        return this.dashboardShape(rows[0]);
      },
      compare: (snapshot, runtime) =>
        this.compare(snapshot, runtime, [
          'totalComponents',
          'stockCount',
          'producingCount',
          'readyCount',
          'shippedCount',
          'deliveredCount',
          'installedCount',
          'totalEstimatedCost',
          'totalActualCost',
        ]),
    });
    if (result.source === 'snapshot') {
      this.metrics.recordComponentReadModelHit();
    } else {
      this.metrics.recordComponentFallback();
      void this.dispatcher.requestUpdate({
        scope: {
          module: 'components',
          snapshotType: 'ComponentDashboardSnapshot',
        },
        reason:
          result.meta.fallbackReason === 'stale'
            ? 'stale-snapshot'
            : 'fallback-miss',
        priority: 60,
      });
    }
    return result;
  }

  async summary(componentId: string) {
    const result = await this.dashboardReader.read({
      module: 'components',
      snapshotType: 'ComponentSummarySnapshot',
      loadSnapshot: async () => {
        const snapshot =
          await this.snapshotReader.componentSummary(componentId);
        return snapshot
          ? { data: snapshot, updatedAt: snapshot.updatedAt, rowCount: 1 }
          : null;
      },
      readSnapshot: (snapshot) => snapshot,
      readRuntime: async () => {
        const rows =
          await this.snapshots.calculateSummarySnapshots(componentId);
        return rows[0] ?? null;
      },
    });
    if (result.source === 'snapshot') {
      this.metrics.recordComponentReadModelHit();
    } else {
      this.metrics.recordComponentFallback();
      void this.dispatcher.requestUpdate({
        scope: {
          module: 'components',
          snapshotType: 'ComponentSummarySnapshot',
          componentId,
        },
        reason:
          result.meta.fallbackReason === 'stale'
            ? 'stale-snapshot'
            : 'fallback-miss',
        priority: 60,
      });
    }
    return result;
  }

  private dashboardShape(snapshot: {
    scopeKey: string;
    snapshotDate: Date;
    totalComponents: number;
    stockCount: number;
    producingCount: number;
    readyCount: number;
    shippedCount: number;
    deliveredCount: number;
    installedCount: number;
    totalEstimatedCost: number;
    totalActualCost: number;
    payload?: unknown;
  }): ComponentDashboardRead {
    return {
      scopeKey: snapshot.scopeKey,
      snapshotDate: snapshot.snapshotDate,
      totalComponents: snapshot.totalComponents,
      stockCount: snapshot.stockCount,
      producingCount: snapshot.producingCount,
      readyCount: snapshot.readyCount,
      shippedCount: snapshot.shippedCount,
      deliveredCount: snapshot.deliveredCount,
      installedCount: snapshot.installedCount,
      totalEstimatedCost: Number(snapshot.totalEstimatedCost),
      totalActualCost: Number(snapshot.totalActualCost),
      payload: snapshot.payload ?? null,
    };
  }

  private compare(
    snapshot: ComponentDashboardRead,
    runtime: ComponentDashboardRead,
    fields: Array<keyof ComponentDashboardRead>,
  ): SnapshotComparisonWarning[] {
    return fields.flatMap((field) => {
      const snapshotValue = Number(snapshot[field] ?? 0);
      const runtimeValue = Number(runtime[field] ?? 0);
      return Math.abs(snapshotValue - runtimeValue) <= 0.0001
        ? []
        : [
            {
              field: String(field),
              snapshotValue,
              runtimeValue,
              reason: 'VALUE_MISMATCH' as const,
            },
          ];
    });
  }

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
