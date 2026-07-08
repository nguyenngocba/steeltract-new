import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  DashboardReadRequest,
  DashboardReadResult,
  SnapshotReadMeta,
} from './dashboard-reader.types';
import { RuntimeAggregateStrategy } from './runtime-aggregate.strategy';
import { SnapshotFeatureFlagService } from './snapshot-feature-flag.service';
import { SnapshotReaderStrategy } from './snapshot-reader.strategy';

@Injectable()
export class DashboardReaderService {
  private readonly logger = new Logger(DashboardReaderService.name);

  constructor(
    @Inject(SnapshotFeatureFlagService)
    private readonly flags: SnapshotFeatureFlagService,
    @Inject(SnapshotReaderStrategy)
    private readonly snapshotStrategy: SnapshotReaderStrategy,
    @Inject(RuntimeAggregateStrategy)
    private readonly runtimeStrategy: RuntimeAggregateStrategy,
  ) {}

  async read<TSnapshot, TResult>(
    request: DashboardReadRequest<TSnapshot, TResult>,
  ): Promise<DashboardReadResult<TResult>> {
    if (!this.flags.isEnabled(request.module)) {
      return this.runtime(request, 'disabled');
    }

    const snapshot = await this.snapshotStrategy.load(request);

    if (!snapshot) {
      return this.runtime(request, 'missing');
    }

    if (snapshot.stale) {
      return this.runtime(request, 'stale', snapshot.meta);
    }

    const snapshotResult = await this.snapshotStrategy.read(
      request,
      snapshot.envelope,
      snapshot.meta,
    );

    if (request.compare && this.flags.parityCheckEnabled()) {
      const runtimeResult = await request.readRuntime();
      const warnings = request.compare(snapshotResult, runtimeResult);

      if (warnings.length > 0) {
        this.logger.warn(
          `Snapshot parity warning ${request.module}/${request.snapshotType}: ${warnings.length} mismatch(es)`,
        );
        return {
          data: runtimeResult,
          source: 'runtime',
          meta: {
            ...snapshot.meta,
            snapshotType: request.snapshotType,
            fallbackReason: 'mismatch',
            warnings,
          },
        };
      }
    }

    return {
      data: snapshotResult,
      source: 'snapshot',
      meta: {
        ...snapshot.meta,
        snapshotType: request.snapshotType,
      },
    };
  }

  private async runtime<TSnapshot, TResult>(
    request: DashboardReadRequest<TSnapshot, TResult>,
    reason: DashboardReadResult<TResult>['meta']['fallbackReason'],
    snapshotMeta?: SnapshotReadMeta,
  ): Promise<DashboardReadResult<TResult>> {
    const data = await this.runtimeStrategy.read(request.readRuntime);

    return {
      data,
      source: 'runtime',
      meta: {
        updatedAt: snapshotMeta?.updatedAt,
        ageSeconds: snapshotMeta?.ageSeconds ?? Number.MAX_SAFE_INTEGER,
        confidence: snapshotMeta?.confidence ?? 0,
        isStale: snapshotMeta?.isStale ?? false,
        snapshotType: request.snapshotType,
        fallbackReason: reason,
      },
    };
  }
}
