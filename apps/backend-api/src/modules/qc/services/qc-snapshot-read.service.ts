import { Injectable } from '@nestjs/common';

import { SnapshotUpdateDispatcher } from '../../../core/jobs/snapshot-update-dispatcher.service';
import { PerformanceMetricsService } from '../../../core/performance/performance-metrics.service';
import { DashboardReaderService } from '../../../core/snapshots/dashboard-reader.service';
import type { SnapshotComparisonWarning } from '../../../core/snapshots/dashboard-reader.types';
import { QcSnapshotRepository } from '../../../core/snapshots/qc-snapshot.repository';
import { SnapshotReaderService } from '../../../core/snapshots/snapshot-reader.service';

type QcDashboardRead = {
  scopeKey: string;
  snapshotDate: Date;
  totalInspections: number;
  pendingCount: number;
  inProgressCount: number;
  passedCount: number;
  failedCount: number;
  reworkCount: number;
  openIssueCount: number;
  openNcrCount: number;
  waitingProductionCount: number;
  passRate: number;
  payload: unknown;
};

@Injectable()
export class QcSnapshotReadService {
  constructor(
    private readonly dashboardReader: DashboardReaderService,
    private readonly snapshotReader: SnapshotReaderService,
    private readonly snapshots: QcSnapshotRepository,
    private readonly dispatcher: SnapshotUpdateDispatcher,
    private readonly metrics: PerformanceMetricsService,
  ) {}

  async dashboard(snapshotDate = new Date()) {
    const day = this.startOfDay(snapshotDate);
    const result = await this.dashboardReader.read({
      module: 'qc',
      snapshotType: 'QcDashboardSnapshot',
      loadSnapshot: async () => {
        const snapshot = await this.snapshotReader.qcDashboard(day);
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
          'totalInspections',
          'pendingCount',
          'inProgressCount',
          'passedCount',
          'failedCount',
          'reworkCount',
          'openIssueCount',
          'openNcrCount',
          'waitingProductionCount',
          'passRate',
        ]),
    });
    if (result.source === 'snapshot') {
      this.metrics.recordQcReadModelHit();
    } else {
      this.metrics.recordQcFallback();
      void this.dispatcher.requestUpdate({
        scope: { module: 'qc', snapshotType: 'QcDashboardSnapshot' },
        reason:
          result.meta.fallbackReason === 'stale'
            ? 'stale-snapshot'
            : 'fallback-miss',
        priority: 60,
      });
    }
    return result;
  }

  async inspection(inspectionId: string) {
    const result = await this.dashboardReader.read({
      module: 'qc',
      snapshotType: 'QcInspectionSnapshot',
      loadSnapshot: async () => {
        const snapshot = await this.snapshotReader.qcInspection(inspectionId);
        return snapshot
          ? { data: snapshot, updatedAt: snapshot.updatedAt, rowCount: 1 }
          : null;
      },
      readSnapshot: (snapshot) => snapshot,
      readRuntime: async () => {
        const rows =
          await this.snapshots.calculateInspectionSnapshots(inspectionId);
        return rows[0] ?? null;
      },
    });
    if (result.source === 'snapshot') {
      this.metrics.recordQcReadModelHit();
    } else {
      this.metrics.recordQcFallback();
      void this.dispatcher.requestUpdate({
        scope: {
          module: 'qc',
          snapshotType: 'QcInspectionSnapshot',
          inspectionId,
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
    totalInspections: number;
    pendingCount: number;
    inProgressCount: number;
    passedCount: number;
    failedCount: number;
    reworkCount: number;
    openIssueCount: number;
    openNcrCount: number;
    waitingProductionCount: number;
    passRate: number;
    payload?: unknown;
  }): QcDashboardRead {
    return { ...snapshot, payload: snapshot.payload ?? null };
  }

  private compare(
    snapshot: QcDashboardRead,
    runtime: QcDashboardRead,
    fields: Array<keyof QcDashboardRead>,
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
