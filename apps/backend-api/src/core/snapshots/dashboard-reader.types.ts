import type { SnapshotDashboardModule } from './snapshot-feature-flag.service';

export interface SnapshotEnvelope<TSnapshot> {
  data: TSnapshot;
  updatedAt?: Date | null;
  rowCount?: number;
}

export interface SnapshotReadMeta {
  ageSeconds: number;
  confidence: number;
  isStale: boolean;
  updatedAt?: Date | null;
}

export interface SnapshotComparisonWarning {
  field: string;
  snapshotValue: number | string | null;
  runtimeValue: number | string | null;
  reason: 'VALUE_MISMATCH' | 'MISSING_SNAPSHOT_FIELD';
}

export interface DashboardReadRequest<TSnapshot, TResult> {
  module: SnapshotDashboardModule;
  snapshotType: string;
  loadSnapshot: () => Promise<SnapshotEnvelope<TSnapshot> | null>;
  readSnapshot: (
    snapshot: TSnapshot,
    meta: SnapshotReadMeta,
  ) => Promise<TResult> | TResult;
  readRuntime: () => Promise<TResult>;
  compare?: (
    snapshotResult: TResult,
    runtimeResult: TResult,
  ) => SnapshotComparisonWarning[];
}

export interface DashboardReadResult<TResult> {
  data: TResult;
  source: 'snapshot' | 'runtime';
  meta: SnapshotReadMeta & {
    snapshotType: string;
    fallbackReason?: 'disabled' | 'missing' | 'stale' | 'mismatch';
    warnings?: SnapshotComparisonWarning[];
  };
}
