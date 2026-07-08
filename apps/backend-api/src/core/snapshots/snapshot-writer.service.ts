import {
  Inject,
  Injectable,
} from '@nestjs/common';

import { PerformanceMetricsService } from '../performance/performance-metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { DispatchSnapshotRepository } from './dispatch-snapshot.repository';
import { InventorySnapshotRepository } from './inventory-snapshot.repository';
import { ProjectSnapshotRepository } from './project-snapshot.repository';

import type { SnapshotUpdateRequest } from '../jobs/snapshot-update-dispatcher.service';

export interface SnapshotWriteResult {
  module: string;
  snapshotType: string;
  scopeId?: string;
  generatedAt: string;
  rowsRead: number;
  rowsWritten: number;
  durationMs: number;
  status: 'updated';
}

@Injectable()
export class SnapshotWriterService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(PerformanceMetricsService)
    private readonly metrics: PerformanceMetricsService,
    @Inject(InventorySnapshotRepository)
    private readonly inventorySnapshots: InventorySnapshotRepository,
    @Inject(ProjectSnapshotRepository)
    private readonly projectSnapshots: ProjectSnapshotRepository,
    @Inject(DispatchSnapshotRepository)
    private readonly dispatchSnapshots: DispatchSnapshotRepository,
  ) {}

  async rebuild(request: SnapshotUpdateRequest): Promise<SnapshotWriteResult> {
    const startedAt = Date.now();

    if (request.scope.module === 'inventory') {
      const [rows, materialRows, locationRows] = await Promise.all([
        this.inventorySnapshots.calculate(new Date()),
        this.inventorySnapshots.calculateMaterialSnapshots(
          request.scope.inventoryItemId,
        ),
        this.inventorySnapshots.calculateLocationSnapshots(),
      ]);
      await this.prisma.$transaction(async (tx) => {
        for (const row of rows) {
          await this.inventorySnapshots.upsert(row, tx);
        }
        for (const row of materialRows) {
          await this.inventorySnapshots.upsertMaterial(row, tx);
        }
        for (const row of locationRows) {
          await this.inventorySnapshots.upsertLocation(row, tx);
        }
        await this.inventorySnapshots.markMissingLocationsEmpty(
          locationRows.map((row) => row.locationKey),
          tx,
        );
      });

      return this.result(
        request,
        rows.length + materialRows.length + locationRows.length,
        rows.length + materialRows.length + locationRows.length,
        startedAt,
      );
    }

    if (request.scope.module === 'projects') {
      const detailTab = this.projectDetailTab(request.scope.snapshotType);
      const [rows, detailRows] = await Promise.all([
        this.projectSnapshots.calculate(request.scope.projectId),
        this.projectSnapshots.calculateDetailSnapshots(
          request.scope.projectId,
          detailTab,
        ),
      ]);
      await this.prisma.$transaction(async (tx) => {
        for (const row of rows) {
          await this.projectSnapshots.upsert(row, tx);
        }
        for (const row of detailRows) {
          await this.projectSnapshots.upsertDetail(
            {
              ...row,
              refreshReason: request.reason,
              sourceWatermark: request.sourceWatermark,
            },
            tx,
          );
        }
      });

      return this.result(
        request,
        rows.length + detailRows.length,
        rows.length + detailRows.length,
        startedAt,
      );
    }

    if (request.scope.module === 'logistics') {
      const rows = await this.dispatchSnapshots.calculate(
        request.scope.dispatchOrderId,
      );
      await this.prisma.$transaction(async (tx) => {
        for (const row of rows) {
          await this.dispatchSnapshots.upsert(row, tx);
        }
      });

      return this.result(request, rows.length, rows.length, startedAt);
    }

    const result = this.result(request, 0, 0, startedAt);
    this.metrics.recordSnapshotRebuild(result.durationMs);
    return result;
  }

  private projectDetailTab(snapshotType: string) {
    if (!snapshotType.startsWith('ProjectDetailSnapshot:')) {
      return undefined;
    }

    const tab = snapshotType.split(':')[1]?.trim();
    return tab || undefined;
  }

  private result(
    request: SnapshotUpdateRequest,
    rowsRead: number,
    rowsWritten: number,
    startedAt: number,
  ): SnapshotWriteResult {
    const durationMs = Date.now() - startedAt;
    this.metrics.recordSnapshotRebuild(durationMs);

    if (request.requestedAt) {
      this.metrics.recordSnapshotLag(
        Math.max(0, Date.now() - new Date(request.requestedAt).getTime()),
      );
    }

    return {
      module: request.scope.module,
      snapshotType: request.scope.snapshotType,
      scopeId:
        request.scope.scopeId ??
        request.scope.projectId ??
        request.scope.inventoryItemId ??
        request.scope.dispatchOrderId,
      generatedAt: new Date().toISOString(),
      rowsRead,
      rowsWritten,
      durationMs,
      status: 'updated',
    };
  }
}
