import { Inject, Injectable } from '@nestjs/common';

import { BackgroundJobManager } from './background-job-manager.service';

export type SnapshotModule =
  | 'inventory'
  | 'projects'
  | 'logistics'
  | 'production'
  | 'components'
  | 'qc'
  | 'yard'
  | 'dashboard';

export interface SnapshotScope {
  module: SnapshotModule;
  snapshotType: string;
  scopeId?: string;
  projectId?: string;
  inventoryItemId?: string;
  warehouseId?: string;
  dispatchOrderId?: string;
  productionOrderId?: string;
  componentId?: string;
  inspectionId?: string;
  yardZoneId?: string;
  workCenterId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface SnapshotUpdateRequest {
  scope: SnapshotScope;
  reason:
    | 'domain-event'
    | 'manual-rebuild'
    | 'scheduled-rebuild'
    | 'stale-snapshot'
    | 'fallback-miss';
  sourceEventId?: string;
  sourceWatermark?: string;
  requestedAt?: string;
  priority?: number;
}

@Injectable()
export class SnapshotUpdateDispatcher {
  constructor(
    @Inject(BackgroundJobManager)
    private readonly jobs: BackgroundJobManager,
  ) {}

  requestUpdate(request: SnapshotUpdateRequest) {
    const payload = {
      ...request,
      requestedAt: request.requestedAt ?? new Date().toISOString(),
    };

    return this.jobs.schedule({
      name: `snapshot.${request.scope.module}.update`,
      queue: 'snapshots',
      payload,
      priority: request.priority ?? 70,
      idempotencyKey: this.key('update', payload),
      maxRetries: 5,
    });
  }

  requestRebuild(request: SnapshotUpdateRequest) {
    const payload = {
      ...request,
      requestedAt: request.requestedAt ?? new Date().toISOString(),
    };

    return this.jobs.schedule({
      name: `snapshot.${request.scope.module}.rebuild`,
      queue: 'snapshot-rebuild',
      payload,
      priority: request.priority ?? 10,
      idempotencyKey: this.key('rebuild', payload),
      maxRetries: 3,
    });
  }

  private key(type: 'update' | 'rebuild', request: SnapshotUpdateRequest) {
    const scope = request.scope;
    const scopeKey =
      scope.scopeId ??
      scope.projectId ??
      scope.inventoryItemId ??
      scope.dispatchOrderId ??
      scope.productionOrderId ??
      scope.componentId ??
      scope.inspectionId ??
      scope.yardZoneId ??
      scope.workCenterId ??
      scope.warehouseId ??
      'global';
    const watermark =
      request.sourceWatermark ??
      request.sourceEventId ??
      scope.toDate ??
      'latest';

    return `snapshot:${type}:${scope.module}:${scope.snapshotType}:${scopeKey}:${watermark}`;
  }
}
