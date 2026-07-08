import {
  Inject,
  Injectable,
} from '@nestjs/common';

import { PerformanceMetricsService } from '../performance/performance-metrics.service';
import {
  DashboardReadRequest,
  SnapshotEnvelope,
  SnapshotReadMeta,
} from './dashboard-reader.types';
import { SnapshotFeatureFlagService } from './snapshot-feature-flag.service';

@Injectable()
export class SnapshotReaderStrategy {
  constructor(
    @Inject(PerformanceMetricsService)
    private readonly metrics: PerformanceMetricsService,
    @Inject(SnapshotFeatureFlagService)
    private readonly flags: SnapshotFeatureFlagService,
  ) {}

  async load<TSnapshot, TResult>(
    request: DashboardReadRequest<TSnapshot, TResult>,
  ) {
    const envelope = await request.loadSnapshot();

    if (!envelope) {
      this.metrics.recordSnapshotMiss();
      return null;
    }

    const meta = this.meta(request.module, envelope);
    this.metrics.recordSnapshotHit();
    this.metrics.recordSnapshotAge(meta.ageSeconds);
    this.metrics.recordSnapshotConfidence(meta.confidence);

    if (meta.isStale) {
      this.metrics.recordSnapshotStale();
      return {
        envelope,
        meta,
        stale: true,
      };
    }

    return {
      envelope,
      meta,
      stale: false,
    };
  }

  read<TSnapshot, TResult>(
    request: DashboardReadRequest<TSnapshot, TResult>,
    envelope: SnapshotEnvelope<TSnapshot>,
    meta: SnapshotReadMeta,
  ) {
    return request.readSnapshot(envelope.data, meta);
  }

  private meta<TSnapshot>(
    module: DashboardReadRequest<TSnapshot, unknown>['module'],
    envelope: SnapshotEnvelope<TSnapshot>,
  ): SnapshotReadMeta {
    const updatedAt = envelope.updatedAt ?? null;
    const ageSeconds = updatedAt
      ? Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 1000))
      : Number.MAX_SAFE_INTEGER;
    const maxAgeSeconds = this.flags.maxAgeSeconds(module);
    const isStale = ageSeconds > maxAgeSeconds;

    return {
      updatedAt,
      ageSeconds,
      isStale,
      confidence: this.confidence(ageSeconds, maxAgeSeconds),
    };
  }

  private confidence(ageSeconds: number, maxAgeSeconds: number) {
    if (!Number.isFinite(ageSeconds) || ageSeconds === Number.MAX_SAFE_INTEGER) {
      return 0;
    }

    if (ageSeconds <= Math.max(30, maxAgeSeconds * 0.1)) {
      return 100;
    }

    if (ageSeconds >= maxAgeSeconds) {
      return 0;
    }

    return Math.max(
      0,
      Math.round(90 * (1 - ageSeconds / maxAgeSeconds)),
    );
  }
}
