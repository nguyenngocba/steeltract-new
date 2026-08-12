import { Injectable } from '@nestjs/common';
import {
  HistoricalDashboardModule,
  OutboxEventStatus,
  Prisma,
} from '@prisma/client';

import { ProjectionRegistryService } from './projection-registry.service';
import { ProjectionRepository } from './projection.repository';

export type ProjectionHealthStatus =
  | 'HEALTHY'
  | 'LAGGING'
  | 'REBUILDING'
  | 'NOT_INITIALIZED'
  | 'FAILED';

export type ProjectionWatermark = {
  module: HistoricalDashboardModule;
  lastEventId: string | null;
  lastAggregateVersion: string | null;
  lastProcessedAt: Date | null;
  sourceOccurredAt: Date | null;
  status: ProjectionHealthStatus;
  fresh: boolean;
  lagMs: number;
};

export type SnapshotFreshness = {
  status: ProjectionHealthStatus;
  fresh: boolean;
  stale: boolean;
  authoritative: boolean;
  parity: boolean;
  lagMs: number;
  ageMs: number;
  snapshotWatermark: string | null;
  currentWatermark: ProjectionWatermark;
};

const modulePrefixes: Record<HistoricalDashboardModule, string[]> = {
  ERP: [
    'inventory.',
    'component.',
    'production.',
    'qc.',
    'project.',
    'yard.',
    'logistics.',
    'dispatch.',
    'supplier.',
    'procurement.',
    'purchase.',
  ],
  INVENTORY: ['inventory.'],
  COMPONENTS: ['component.'],
  PRODUCTION: ['production.'],
  PROJECTS: ['project.'],
  SUPPLIERS: ['supplier.', 'procurement.', 'purchase.'],
  QC: ['qc.'],
  DISPATCH: ['logistics.', 'dispatch.'],
  LOGISTICS: ['logistics.', 'dispatch.'],
  YARD: ['yard.'],
};

@Injectable()
export class ProjectionWatermarkService {
  constructor(
    private readonly repository: ProjectionRepository,
    private readonly registry: ProjectionRegistryService,
  ) {}

  async forModule(
    module: HistoricalDashboardModule,
  ): Promise<ProjectionWatermark> {
    const event = await this.repository.latestOutboxEvent(
      modulePrefixes[module],
    );
    if (!event) {
      return {
        module,
        lastEventId: null,
        lastAggregateVersion: null,
        lastProcessedAt: null,
        sourceOccurredAt: null,
        status: 'NOT_INITIALIZED',
        fresh: false,
        lagMs: 0,
      };
    }

    const status = this.outboxStatus(event.status);
    const processedAt = event.dispatchedAt ?? null;
    const lagEnd = processedAt?.getTime() ?? Date.now();
    return {
      module,
      lastEventId: event.id,
      lastAggregateVersion: this.aggregateVersion(
        event.metadata,
        event.payload,
      ),
      lastProcessedAt: processedAt,
      sourceOccurredAt: event.createdAt,
      status,
      fresh: status === 'HEALTHY',
      lagMs: Math.max(0, lagEnd - event.createdAt.getTime()),
    };
  }

  async health() {
    const [checkpoints, failures, documents, receipts] = await Promise.all([
      this.repository.checkpoints(),
      this.repository.activeFailureCounts(),
      this.repository.documentCounts(),
      this.repository.latestCheckpointReceipts(),
    ]);
    const checkpointMap = new Map(
      checkpoints.map((item) => [item.projectionName, item]),
    );
    const failureMap = new Map(
      failures.map((item) => [item.projectionName, item._count._all]),
    );
    const documentMap = new Map(
      documents.map((item) => [item.projectionName, item._count._all]),
    );
    const receiptMap = new Map(
      receipts.map((item) => [item.projectionName, item]),
    );

    return this.registry.names().map((projectionName) => {
      const checkpoint = checkpointMap.get(projectionName);
      const activeFailures = failureMap.get(projectionName) ?? 0;
      const receipt = receiptMap.get(projectionName);
      const status = this.checkpointStatus(checkpoint?.status, activeFailures);
      return {
        projectionName,
        status,
        schemaVersion: checkpoint?.schemaVersion ?? 1,
        documents: documentMap.get(projectionName) ?? 0,
        processedCount: checkpoint?.processedCount ?? 0,
        failedCount: checkpoint?.failedCount ?? 0,
        activeFailures,
        lagMs: checkpoint?.lagMs ?? null,
        lastEventId: checkpoint?.lastOutboxEventId ?? null,
        lastAggregateVersion: receipt?.aggregateVersion?.toString() ?? null,
        lastProcessedAt: checkpoint?.lastProcessedAt ?? null,
        lastError: checkpoint?.lastError ?? null,
      };
    });
  }

  async evaluateSnapshot(snapshot: {
    module: HistoricalDashboardModule;
    sourceWatermark: string | null;
    generatedAt: Date;
    metadata: Prisma.JsonValue;
  }): Promise<SnapshotFreshness> {
    const currentWatermark = await this.forModule(snapshot.module);
    const stored = this.record(snapshot.metadata).projectionWatermark;
    const storedWatermark = this.record(stored);
    const snapshotWatermark =
      this.string(storedWatermark.lastEventId) ?? snapshot.sourceWatermark;
    const parity = snapshotWatermark === currentWatermark.lastEventId;
    const fresh = currentWatermark.fresh && parity;

    return {
      status: fresh
        ? 'HEALTHY'
        : currentWatermark.status === 'HEALTHY'
          ? 'LAGGING'
          : currentWatermark.status,
      fresh,
      stale: !fresh,
      authoritative: fresh,
      parity,
      lagMs: parity
        ? currentWatermark.lagMs
        : Math.max(
            0,
            (currentWatermark.lastProcessedAt?.getTime() ?? Date.now()) -
              snapshot.generatedAt.getTime(),
          ),
      ageMs: Math.max(0, Date.now() - snapshot.generatedAt.getTime()),
      snapshotWatermark,
      currentWatermark,
    };
  }

  private outboxStatus(status: OutboxEventStatus): ProjectionHealthStatus {
    if (status === OutboxEventStatus.DISPATCHED) return 'HEALTHY';
    if (
      status === OutboxEventStatus.FAILED ||
      status === OutboxEventStatus.DEAD_LETTER
    ) {
      return 'FAILED';
    }
    return 'LAGGING';
  }

  private checkpointStatus(
    status: string | undefined,
    activeFailures: number,
  ): ProjectionHealthStatus {
    if (activeFailures > 0 || status === 'DEGRADED' || status === 'FAILED') {
      return 'FAILED';
    }
    if (status === 'REBUILDING') return 'REBUILDING';
    if (!status) return 'NOT_INITIALIZED';
    if (status === 'LAGGING') return 'LAGGING';
    return 'HEALTHY';
  }

  private aggregateVersion(
    metadata: Prisma.JsonValue | null,
    payload: Prisma.JsonValue,
  ) {
    const value =
      this.record(metadata).aggregateVersion ??
      this.record(payload).aggregateVersion;
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'number' || typeof value === 'string') {
      return String(value);
    }
    return null;
  }

  private record(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private string(value: unknown) {
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
