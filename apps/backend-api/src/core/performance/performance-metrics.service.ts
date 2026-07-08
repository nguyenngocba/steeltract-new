import { AsyncLocalStorage } from 'async_hooks';
import {
  appendFileSync,
  mkdirSync,
} from 'fs';
import { dirname, resolve } from 'path';

import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  QueryBudgetClass,
  QUERY_BUDGET_MS,
} from './query-budget';

export interface SlowQueryRecord {
  label: string;
  durationMs: number;
  occurredAt: string;
  metadata?: unknown;
}

interface PrismaQueryMetric {
  model?: string;
  action?: string;
  durationMs: number;
  target?: string;
}

interface RuntimeRequestContext {
  id: string;
  endpoint: string;
  method: string;
  budgetClass: QueryBudgetClass;
  budgetMs: number;
  startedAt: number;
  startedHeapUsed: number;
  prismaQueryCount: number;
  sqlTotalMs: number;
  longestSqlMs: number;
  longestQuery?: PrismaQueryMetric;
  duplicateKeys: Map<string, number>;
  queries: PrismaQueryMetric[];
}

interface RequestFinishInput {
  statusCode: number;
  responseSizeBytes?: number;
}

interface RuntimeRequestRecord {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  prismaQueryCount: number;
  sqlTotalMs: number;
  longestSqlMs: number;
  longestQuery?: ReturnType<PerformanceMetricsService['sanitizeQueryMetric']>;
  memory: {
    heapUsed: number;
    heapDeltaBytes: number;
    peakHeapUsed: number;
  };
  responseSizeBytes?: number;
  budgetClass: QueryBudgetClass;
  budgetMs: number;
  budgetExceeded: boolean;
  duplicateWarnings: ReturnType<PerformanceMetricsService['collectDuplicateWarnings']>;
  timestamp: string;
  timestampMs: number;
}

interface RuntimeQueryRecord {
  endpoint: string;
  method: string;
  model: string;
  action: string;
  durationMs: number;
  target?: string;
  timestamp: string;
  timestampMs: number;
}

const runtimeWindows = [
  {
    key: '5m',
    label: '5 minutes',
    durationMs: 5 * 60 * 1000,
  },
  {
    key: '1h',
    label: '1 hour',
    durationMs: 60 * 60 * 1000,
  },
  {
    key: '24h',
    label: '24 hours',
    durationMs: 24 * 60 * 60 * 1000,
  },
] as const;

const maxRuntimeRetentionMs = 24 * 60 * 60 * 1000;

@Injectable()
export class PerformanceMetricsService {
  private readonly logger = new Logger(PerformanceMetricsService.name);
  private readonly requestStorage =
    new AsyncLocalStorage<RuntimeRequestContext>();

  private websocketEmitted = 0;
  private websocketDropped = 0;
  private websocketDeduped = 0;
  private readonly slowQueries: SlowQueryRecord[] = [];
  private readonly recentRequests: RuntimeRequestRecord[] = [];
  private readonly requestSamples: RuntimeRequestRecord[] = [];
  private readonly querySamples: RuntimeQueryRecord[] = [];
  private readonly cacheHitSamples: number[] = [];
  private readonly readModelHitSamples: number[] = [];
  private readonly fallbackQuerySamples: number[] = [];
  private readonly snapshotMissSamples: number[] = [];
  private readonly snapshotHitSamples: number[] = [];
  private readonly materialSnapshotHitSamples: number[] = [];
  private readonly materialSnapshotMissSamples: number[] = [];
  private readonly locationSnapshotHitSamples: number[] = [];
  private readonly locationSnapshotMissSamples: number[] = [];
  private readonly projectSnapshotHitSamples: number[] = [];
  private readonly projectSnapshotMissSamples: number[] = [];
  private readonly projectReadModelHitSamples: number[] = [];
  private readonly projectFallbackSamples: number[] = [];
  private readonly projectDetailSnapshotHitSamples: number[] = [];
  private readonly planningSnapshotHitSamples: number[] = [];
  private readonly timelineSnapshotHitSamples: number[] = [];
  private readonly allocationSnapshotHitSamples: number[] = [];
  private readonly projectDetailFallbackSamples: number[] = [];
  private readonly projectDetailSnapshotAgeSamples: Array<{
    timestampMs: number;
    ageSeconds: number;
  }> = [];
  private readonly projectDetailSnapshotLagSamples: Array<{
    timestampMs: number;
    lagMs: number;
  }> = [];
  private readonly snapshotFallbackSamples: number[] = [];
  private readonly snapshotStaleSamples: number[] = [];
  private readonly snapshotRebuildSamples: Array<{
    timestampMs: number;
    durationMs: number;
  }> = [];
  private readonly snapshotLagSamples: Array<{
    timestampMs: number;
    lagMs: number;
  }> = [];
  private readonly snapshotAgeSamples: Array<{
    timestampMs: number;
    ageSeconds: number;
  }> = [];
  private readonly snapshotConfidenceSamples: Array<{
    timestampMs: number;
    confidence: number;
  }> = [];
  private readonly recentBudgetWarnings: unknown[] = [];
  private readonly nPlusOneWarnings: unknown[] = [];
  private requestCount = 0;
  private slowRequestCount = 0;
  private slowQueryCount = 0;
  private totalResponseMs = 0;
  private peakHeapUsed = 0;
  private readModelHits = 0;
  private cacheHits = 0;
  private requestSequence = 0;

  createRequestContext(input: {
    endpoint: string;
    method: string;
    budgetClass: QueryBudgetClass;
    budgetMs: number;
  }): RuntimeRequestContext {
    const memory = process.memoryUsage();
    this.peakHeapUsed = Math.max(this.peakHeapUsed, memory.heapUsed);

    return {
      id: `${Date.now()}-${++this.requestSequence}`,
      endpoint: input.endpoint,
      method: input.method,
      budgetClass: input.budgetClass,
      budgetMs: input.budgetMs,
      startedAt: Date.now(),
      startedHeapUsed: memory.heapUsed,
      prismaQueryCount: 0,
      sqlTotalMs: 0,
      longestSqlMs: 0,
      duplicateKeys: new Map<string, number>(),
      queries: [],
    };
  }

  runWithRequest<T>(
    context: RuntimeRequestContext,
    callback: () => T,
  ): T {
    return this.requestStorage.run(context, callback);
  }

  finishRequest(
    context: RuntimeRequestContext,
    input: RequestFinishInput,
  ) {
    const endedAt = Date.now();
    const memory = process.memoryUsage();
    const durationMs = endedAt - context.startedAt;
    const heapDeltaBytes = memory.heapUsed - context.startedHeapUsed;
    const peakHeapUsed = Math.max(context.startedHeapUsed, memory.heapUsed);
    const budgetExceeded = durationMs > context.budgetMs;
    const duplicateWarnings = this.collectDuplicateWarnings(context);

    this.requestCount += 1;
    this.totalResponseMs += durationMs;
    this.peakHeapUsed = Math.max(this.peakHeapUsed, peakHeapUsed);

    if (durationMs > 1000) {
      this.slowRequestCount += 1;
    }

    const record: RuntimeRequestRecord = {
      endpoint: context.endpoint,
      method: context.method,
      statusCode: input.statusCode,
      durationMs,
      prismaQueryCount: context.prismaQueryCount,
      sqlTotalMs: Math.round(context.sqlTotalMs),
      longestSqlMs: Math.round(context.longestSqlMs),
      longestQuery: context.longestQuery
        ? this.sanitizeQueryMetric(context.longestQuery)
        : undefined,
      memory: {
        heapUsed: memory.heapUsed,
        heapDeltaBytes,
        peakHeapUsed,
      },
      responseSizeBytes: input.responseSizeBytes,
      budgetClass: context.budgetClass,
      budgetMs: context.budgetMs,
      budgetExceeded,
      duplicateWarnings,
      timestamp: new Date(endedAt).toISOString(),
      timestampMs: endedAt,
    };

    this.recentRequests.unshift(record);
    this.recentRequests.splice(100);
    this.requestSamples.push(record);
    this.pruneRuntimeSamples(endedAt);

    if (budgetExceeded) {
      this.recentBudgetWarnings.unshift(record);
      this.recentBudgetWarnings.splice(50);
      this.logger.warn(
        `Budget exceeded ${context.method} ${context.endpoint}: ${durationMs}ms > ${context.budgetMs}ms (${context.budgetClass})`,
      );
    }

    for (const warning of duplicateWarnings) {
      this.nPlusOneWarnings.unshift({
        ...warning,
        endpoint: context.endpoint,
        method: context.method,
        timestamp: record.timestamp,
      });
    }
    this.nPlusOneWarnings.splice(50);

    this.logger.log(
      `${context.method} ${context.endpoint} ${durationMs}ms status=${input.statusCode} prisma=${context.prismaQueryCount} sqlTotal=${Math.round(context.sqlTotalMs)}ms longestSql=${Math.round(context.longestSqlMs)}ms heapDelta=${Math.round(heapDeltaBytes / 1024 / 1024)}MB`,
    );
  }

  recordWebsocketEmit() {
    this.websocketEmitted += 1;
  }

  recordWebsocketDrop() {
    this.websocketDropped += 1;
  }

  recordWebsocketDedupe() {
    this.websocketDeduped += 1;
  }

  recordSlowQuery(record: Omit<SlowQueryRecord, 'occurredAt'>) {
    this.slowQueries.unshift({
      ...record,
      occurredAt: new Date().toISOString(),
    });
    this.slowQueries.splice(50);
  }

  recordPrismaQuery(metric: PrismaQueryMetric) {
    const context = this.requestStorage.getStore();
    const now = Date.now();
    const normalized = {
      model: metric.model ?? 'Unknown',
      action: metric.action ?? 'query',
      durationMs: Number(metric.durationMs ?? 0),
      target: metric.target,
    };

    if (context) {
      context.prismaQueryCount += 1;
      context.sqlTotalMs += normalized.durationMs;
      context.queries.push(normalized);

      if (normalized.durationMs > context.longestSqlMs) {
        context.longestSqlMs = normalized.durationMs;
        context.longestQuery = normalized;
      }

      const key = `${normalized.model}.${normalized.action}`;
      context.duplicateKeys.set(
        key,
        (context.duplicateKeys.get(key) ?? 0) + 1,
      );
    }

    this.querySamples.push({
      endpoint: context?.endpoint ?? 'background',
      method: context?.method ?? 'N/A',
      model: normalized.model,
      action: normalized.action,
      durationMs: normalized.durationMs,
      target: normalized.target,
      timestamp: new Date(now).toISOString(),
      timestampMs: now,
    });
    this.pruneRuntimeSamples(now);

    if (normalized.durationMs > 200) {
      this.slowQueryCount += 1;
      this.recordSlowQuery({
        label: `${normalized.model}.${normalized.action}`,
        durationMs: normalized.durationMs,
        metadata: {
          endpoint: context?.endpoint,
          method: context?.method,
          budgetClass: context?.budgetClass,
          target: normalized.target,
        },
      });
      this.writeSlowQueryLog({
        endpoint: context?.endpoint ?? 'background',
        method: context?.method ?? 'N/A',
        model: normalized.model,
        action: normalized.action,
        elapsed: normalized.durationMs,
        occurredAt: new Date().toISOString(),
      });
    }

    const budget =
      context?.budgetMs ??
      QUERY_BUDGET_MS.default;
    if (normalized.durationMs > budget) {
      const warning = {
        endpoint: context?.endpoint ?? 'background',
        method: context?.method ?? 'N/A',
        model: normalized.model,
        action: normalized.action,
        elapsed: Math.round(normalized.durationMs),
        budgetMs: budget,
        marker: 'Budget exceeded',
        occurredAt: new Date().toISOString(),
      };
      this.recentBudgetWarnings.unshift(warning);
      this.recentBudgetWarnings.splice(50);
      this.logger.warn(
        `Budget exceeded ${warning.model}.${warning.action}: ${warning.elapsed}ms > ${budget}ms`,
      );
    }
  }

  recordReadModelHit() {
    this.readModelHits += 1;
    this.readModelHitSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordCacheHit() {
    this.cacheHits += 1;
    this.cacheHitSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordReadModelFallback() {
    this.fallbackQuerySamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordSnapshotMiss() {
    this.snapshotMissSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordSnapshotHit() {
    this.snapshotHitSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordMaterialSnapshotHit() {
    this.snapshotHitSamples.push(Date.now());
    this.materialSnapshotHitSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordMaterialSnapshotMiss() {
    this.snapshotMissSamples.push(Date.now());
    this.materialSnapshotMissSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordLocationSnapshotHit() {
    this.snapshotHitSamples.push(Date.now());
    this.locationSnapshotHitSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordLocationSnapshotMiss() {
    this.snapshotMissSamples.push(Date.now());
    this.locationSnapshotMissSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordProjectSnapshotHit() {
    this.snapshotHitSamples.push(Date.now());
    this.projectSnapshotHitSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordProjectSnapshotMiss() {
    this.snapshotMissSamples.push(Date.now());
    this.projectSnapshotMissSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordProjectReadModelHit() {
    this.recordReadModelHit();
    this.projectReadModelHitSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordProjectFallback() {
    this.recordReadModelFallback();
    this.projectFallbackSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordProjectDetailSnapshotHit(tab?: string) {
    const now = Date.now();
    this.snapshotHitSamples.push(now);
    this.projectDetailSnapshotHitSamples.push(now);
    if (['progress', 'planning', 'command', 'site'].includes(tab ?? '')) {
      this.planningSnapshotHitSamples.push(now);
      this.timelineSnapshotHitSamples.push(now);
    }
    if (['materials', 'components', 'overview', 'costs'].includes(tab ?? '')) {
      this.allocationSnapshotHitSamples.push(now);
    }
    this.pruneRuntimeSamples(now);
  }

  recordProjectDetailSnapshotMiss() {
    this.snapshotMissSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordProjectDetailFallback() {
    this.recordReadModelFallback();
    this.projectDetailFallbackSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordProjectDetailSnapshotAge(ageSeconds: number) {
    const now = Date.now();
    this.projectDetailSnapshotAgeSamples.push({ timestampMs: now, ageSeconds });
    this.recordSnapshotAge(ageSeconds);
  }

  recordProjectDetailSnapshotLag(lagMs: number) {
    const now = Date.now();
    this.projectDetailSnapshotLagSamples.push({ timestampMs: now, lagMs });
    this.recordSnapshotLag(lagMs);
  }

  recordSnapshotRebuild(durationMs: number) {
    const now = Date.now();
    this.snapshotRebuildSamples.push({
      timestampMs: now,
      durationMs,
    });
    this.pruneRuntimeSamples(now);
  }

  recordSnapshotFallback() {
    this.snapshotFallbackSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordSnapshotStale() {
    this.snapshotStaleSamples.push(Date.now());
    this.pruneRuntimeSamples(Date.now());
  }

  recordSnapshotAge(ageSeconds: number) {
    const now = Date.now();
    this.snapshotAgeSamples.push({
      timestampMs: now,
      ageSeconds,
    });
    this.pruneRuntimeSamples(now);
  }

  recordSnapshotConfidence(confidence: number) {
    const now = Date.now();
    this.snapshotConfidenceSamples.push({
      timestampMs: now,
      confidence,
    });
    this.pruneRuntimeSamples(now);
  }

  recordSnapshotLag(lagMs: number) {
    const now = Date.now();
    this.snapshotLagSamples.push({
      timestampMs: now,
      lagMs,
    });
    this.pruneRuntimeSamples(now);
  }

  snapshot(): Record<string, unknown> {
    const memory = process.memoryUsage();
    const avgResponseMs =
      this.requestCount > 0
        ? Math.round(this.totalResponseMs / this.requestCount)
        : 0;

    return {
      uptimeSeconds: Math.round(process.uptime()),
      requests: {
        count: this.requestCount,
        avgResponseMs,
        slowRequestCount: this.slowRequestCount,
        recent: this.recentRequests,
      },
      queries: {
        slowQueryCount: this.slowQueryCount,
        slowQueries: this.slowQueries,
        budgetWarnings: this.recentBudgetWarnings,
        nPlusOneWarnings: this.nPlusOneWarnings,
      },
      readModels: {
        hits: this.readModelHits,
      },
      snapshots: this.snapshotRuntimeSummary(
        Date.now() - maxRuntimeRetentionMs,
      ),
      cache: {
        hits: this.cacheHits,
      },
      analytics: this.analyticsSnapshot(),
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        peakHeapUsed: this.peakHeapUsed,
      },
      websocket: {
        emitted: this.websocketEmitted,
        dropped: this.websocketDropped,
        deduped: this.websocketDeduped,
      },
      slowQueries: this.slowQueries,
      generatedAt: new Date().toISOString(),
    };
  }

  analyticsSnapshot(): Record<string, unknown> {
    const now = Date.now();
    const windows = runtimeWindows.reduce(
      (acc, window) => {
        const since = now - window.durationMs;
        const requests = this.requestSamples.filter(
          (row) => row.timestampMs >= since,
        );
        const queries = this.querySamples.filter(
          (row) => row.timestampMs >= since,
        );
        const readModelHits = this.countSince(this.readModelHitSamples, since);
        const cacheHits = this.countSince(this.cacheHitSamples, since);
        const fallbackQueries = this.countSince(this.fallbackQuerySamples, since);
        const snapshotMisses = this.countSince(this.snapshotMissSamples, since);
        const snapshotHits = this.countSince(this.snapshotHitSamples, since);

        acc[window.key] = {
          label: window.label,
          requestCount: requests.length,
          endpointRanking: this.rankEndpoints(requests, queries),
          queryRanking: this.rankQueries(queries),
          readModelEffectiveness: this.readModelEffectiveness({
            requestCount: requests.length,
            queryCount: queries.length,
            readModelHits,
            cacheHits,
            fallbackQueries,
            snapshotMisses,
            snapshotHits,
          }),
          snapshots: this.snapshotRuntimeSummary(since),
          performanceScore: this.performanceScoreByModule(requests),
          architectureScore: this.architectureScoreByModule(requests, {
            readModelHits,
            cacheHits,
            fallbackQueries,
            snapshotMisses,
            snapshotHits,
          }),
          recommendations: this.buildRecommendations(requests, queries, {
            readModelHits,
            cacheHits,
            fallbackQueries,
            snapshotMisses,
            snapshotHits,
          }),
        };

        return acc;
      },
      {} as Record<string, unknown>,
    );

    return {
      windows,
      topSlowEndpoints: this.rankEndpoints(this.requestSamples, this.querySamples)
        .byP95.slice(0, 10),
      topQueries: this.rankQueries(this.querySamples).byAverage.slice(0, 10),
      runtimeTrend: {
        current24h: this.rankEndpoints(this.requestSamples, this.querySamples)
          .summary,
        sevenDays: {
          available: false,
          reason:
            'Requires persisted runtime metrics beyond the current 24h in-memory window.',
        },
        thirtyDays: {
          available: false,
          reason:
            'Requires persisted runtime metrics beyond the current 24h in-memory window.',
        },
        ninetyDays: {
          available: false,
          reason:
            'Requires persisted runtime metrics beyond the current 24h in-memory window.',
        },
      },
      generatedAt: new Date(now).toISOString(),
    };
  }

  private collectDuplicateWarnings(context: RuntimeRequestContext) {
    return Array.from(context.duplicateKeys.entries())
      .filter(([, count]) => count >= 10)
      .map(([queryKey, count]) => ({
        queryKey,
        count,
        severity: count >= 25 ? 'HIGH' : 'MEDIUM',
        recommendation: 'Batch query or move to read model',
      }));
  }

  private sanitizeQueryMetric(metric: PrismaQueryMetric) {
    return {
      model: metric.model,
      action: metric.action,
      durationMs: Math.round(metric.durationMs),
      target: metric.target,
    };
  }

  private writeSlowQueryLog(entry: {
    endpoint: string;
    method: string;
    model: string;
    action: string;
    elapsed: number;
    occurredAt: string;
  }) {
    const logPath = this.slowQueryLogPath();
    mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(
      logPath,
      `${JSON.stringify({
        ...entry,
        elapsed: Math.round(entry.elapsed),
      })}\n`,
      'utf8',
    );
  }

  private pruneRuntimeSamples(now: number) {
    const minTimestamp = now - maxRuntimeRetentionMs;
    this.pruneByTimestamp(this.requestSamples, minTimestamp);
    this.pruneByTimestamp(this.querySamples, minTimestamp);
    this.pruneNumberSamples(this.cacheHitSamples, minTimestamp);
    this.pruneNumberSamples(this.readModelHitSamples, minTimestamp);
    this.pruneNumberSamples(this.fallbackQuerySamples, minTimestamp);
    this.pruneNumberSamples(this.snapshotMissSamples, minTimestamp);
    this.pruneNumberSamples(this.snapshotHitSamples, minTimestamp);
    this.pruneNumberSamples(this.materialSnapshotHitSamples, minTimestamp);
    this.pruneNumberSamples(this.materialSnapshotMissSamples, minTimestamp);
    this.pruneNumberSamples(this.locationSnapshotHitSamples, minTimestamp);
    this.pruneNumberSamples(this.locationSnapshotMissSamples, minTimestamp);
    this.pruneNumberSamples(this.projectSnapshotHitSamples, minTimestamp);
    this.pruneNumberSamples(this.projectSnapshotMissSamples, minTimestamp);
    this.pruneNumberSamples(this.projectReadModelHitSamples, minTimestamp);
    this.pruneNumberSamples(this.projectFallbackSamples, minTimestamp);
    this.pruneNumberSamples(this.projectDetailSnapshotHitSamples, minTimestamp);
    this.pruneNumberSamples(this.planningSnapshotHitSamples, minTimestamp);
    this.pruneNumberSamples(this.timelineSnapshotHitSamples, minTimestamp);
    this.pruneNumberSamples(this.allocationSnapshotHitSamples, minTimestamp);
    this.pruneNumberSamples(this.projectDetailFallbackSamples, minTimestamp);
    this.pruneByTimestamp(this.projectDetailSnapshotAgeSamples, minTimestamp);
    this.pruneByTimestamp(this.projectDetailSnapshotLagSamples, minTimestamp);
    this.pruneNumberSamples(this.snapshotFallbackSamples, minTimestamp);
    this.pruneNumberSamples(this.snapshotStaleSamples, minTimestamp);
    this.pruneByTimestamp(this.snapshotRebuildSamples, minTimestamp);
    this.pruneByTimestamp(this.snapshotLagSamples, minTimestamp);
    this.pruneByTimestamp(this.snapshotAgeSamples, minTimestamp);
    this.pruneByTimestamp(this.snapshotConfidenceSamples, minTimestamp);
  }

  private pruneByTimestamp<T extends { timestampMs: number }>(
    rows: T[],
    minTimestamp: number,
  ) {
    while (rows.length > 0 && rows[0].timestampMs < minTimestamp) {
      rows.shift();
    }
  }

  private pruneNumberSamples(rows: number[], minTimestamp: number) {
    while (rows.length > 0 && rows[0] < minTimestamp) {
      rows.shift();
    }
  }

  private countSince(rows: number[], since: number) {
    return rows.filter((value) => value >= since).length;
  }

  private snapshotRuntimeSummary(since: number) {
    const rebuilds = this.snapshotRebuildSamples.filter(
      (row) => row.timestampMs >= since,
    );
    const lags = this.snapshotLagSamples.filter(
      (row) => row.timestampMs >= since,
    );

    return {
      hits: this.countSince(this.snapshotHitSamples, since),
      misses: this.countSince(this.snapshotMissSamples, since),
      materialSnapshotHit: this.countSince(this.materialSnapshotHitSamples, since),
      materialSnapshotMiss: this.countSince(this.materialSnapshotMissSamples, since),
      locationSnapshotHit: this.countSince(this.locationSnapshotHitSamples, since),
      locationSnapshotMiss: this.countSince(this.locationSnapshotMissSamples, since),
      projectSnapshotHit: this.countSince(this.projectSnapshotHitSamples, since),
      projectSnapshotMiss: this.countSince(this.projectSnapshotMissSamples, since),
      projectReadModelHit: this.countSince(this.projectReadModelHitSamples, since),
      projectFallbackCount: this.countSince(this.projectFallbackSamples, since),
      projectDetailSnapshotHit: this.countSince(this.projectDetailSnapshotHitSamples, since),
      planningSnapshotHit: this.countSince(this.planningSnapshotHitSamples, since),
      timelineSnapshotHit: this.countSince(this.timelineSnapshotHitSamples, since),
      allocationSnapshotHit: this.countSince(this.allocationSnapshotHitSamples, since),
      projectDetailFallback: this.countSince(this.projectDetailFallbackSamples, since),
      projectDetailAverageAgeSeconds: this.average(
        this.projectDetailSnapshotAgeSamples
          .filter((row) => row.timestampMs >= since)
          .map((row) => row.ageSeconds),
      ),
      projectDetailAverageLagMs: this.average(
        this.projectDetailSnapshotLagSamples
          .filter((row) => row.timestampMs >= since)
          .map((row) => row.lagMs),
      ),
      fallbacks: this.countSince(this.snapshotFallbackSamples, since),
      stale: this.countSince(this.snapshotStaleSamples, since),
      rebuilds: rebuilds.length,
      averageRebuildMs: this.average(rebuilds.map((row) => row.durationMs)),
      averageLagMs: this.average(lags.map((row) => row.lagMs)),
      maxLagMs: Math.max(...lags.map((row) => row.lagMs), 0),
      averageAgeSeconds: this.average(
        this.snapshotAgeSamples
          .filter((row) => row.timestampMs >= since)
          .map((row) => row.ageSeconds),
      ),
      averageConfidence: this.average(
        this.snapshotConfidenceSamples
          .filter((row) => row.timestampMs >= since)
          .map((row) => row.confidence),
      ),
    };
  }

  private rankEndpoints(
    requests: RuntimeRequestRecord[],
    queries: RuntimeQueryRecord[],
  ) {
    const grouped = new Map<
      string,
      {
        endpoint: string;
        method: string;
        durations: number[];
        sqlCounts: number[];
        sqlTimes: number[];
        slowQueryCount: number;
        memoryDeltas: number[];
      }
    >();

    for (const request of requests) {
      const key = `${request.method} ${request.endpoint}`;
      const row =
        grouped.get(key) ??
        {
          endpoint: request.endpoint,
          method: request.method,
          durations: [],
          sqlCounts: [],
          sqlTimes: [],
          slowQueryCount: 0,
          memoryDeltas: [],
        };
      row.durations.push(request.durationMs);
      row.sqlCounts.push(request.prismaQueryCount);
      row.sqlTimes.push(request.sqlTotalMs);
      row.memoryDeltas.push(request.memory.heapDeltaBytes);
      grouped.set(key, row);
    }

    const slowQueryCounts = new Map<string, number>();
    for (const query of queries) {
      if (query.durationMs <= 200) {
        continue;
      }
      const key = `${query.method} ${query.endpoint}`;
      slowQueryCounts.set(key, (slowQueryCounts.get(key) ?? 0) + 1);
    }

    const rows = Array.from(grouped.entries()).map(([key, row]) => {
      row.slowQueryCount = slowQueryCounts.get(key) ?? 0;
      return {
        endpoint: row.endpoint,
        method: row.method,
        requestCount: row.durations.length,
        averageLatencyMs: this.average(row.durations),
        p95LatencyMs: this.percentile(row.durations, 95),
        p99LatencyMs: this.percentile(row.durations, 99),
        maxLatencyMs: Math.max(...row.durations, 0),
        averageSqlCount: this.average(row.sqlCounts),
        averageSqlTimeMs: this.average(row.sqlTimes),
        slowQueryCount: row.slowQueryCount,
        averageMemoryDeltaBytes: this.average(row.memoryDeltas),
      };
    });

    return {
      summary: {
        endpointCount: rows.length,
        requestCount: requests.length,
        averageLatencyMs: this.average(requests.map((row) => row.durationMs)),
        p95LatencyMs: this.percentile(
          requests.map((row) => row.durationMs),
          95,
        ),
        p99LatencyMs: this.percentile(
          requests.map((row) => row.durationMs),
          99,
        ),
      },
      byAverage: [...rows]
        .sort((a, b) => b.averageLatencyMs - a.averageLatencyMs)
        .slice(0, 10),
      byP95: [...rows]
        .sort((a, b) => b.p95LatencyMs - a.p95LatencyMs)
        .slice(0, 10),
      byRequestCount: [...rows]
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 10),
    };
  }

  private rankQueries(queries: RuntimeQueryRecord[]) {
    const grouped = new Map<
      string,
      {
        model: string;
        action: string;
        durations: number[];
      }
    >();

    for (const query of queries) {
      const key = `${query.model}.${query.action}`;
      const row =
        grouped.get(key) ??
        {
          model: query.model,
          action: query.action,
          durations: [],
        };
      row.durations.push(query.durationMs);
      grouped.set(key, row);
    }

    const rows = Array.from(grouped.values()).map((row) => ({
      model: row.model,
      action: row.action,
      executionCount: row.durations.length,
      averageTimeMs: this.average(row.durations),
      maxTimeMs: Math.max(...row.durations, 0),
      p95TimeMs: this.percentile(row.durations, 95),
    }));

    return {
      byExecutionCount: [...rows]
        .sort((a, b) => b.executionCount - a.executionCount)
        .slice(0, 10),
      byAverage: [...rows]
        .sort((a, b) => b.averageTimeMs - a.averageTimeMs)
        .slice(0, 10),
      byMax: [...rows]
        .sort((a, b) => b.maxTimeMs - a.maxTimeMs)
        .slice(0, 10),
    };
  }

  private readModelEffectiveness(input: {
    requestCount: number;
    queryCount: number;
    readModelHits: number;
    cacheHits: number;
    fallbackQueries: number;
    snapshotMisses: number;
    snapshotHits?: number;
  }) {
    const reuseSignals =
      input.readModelHits + input.cacheHits + (input.snapshotHits ?? 0);
    const liveSignals =
      input.queryCount + input.fallbackQueries + input.snapshotMisses;
    const denominator = reuseSignals + liveSignals;
    const hitRate =
      denominator > 0 ? Math.round((reuseSignals / denominator) * 100) : 0;

    return {
      cacheHits: input.cacheHits,
      readModelHits: input.readModelHits,
      snapshotHits: input.snapshotHits ?? 0,
      fallbackQueries: input.fallbackQueries,
      snapshotMisses: input.snapshotMisses,
      hitRate,
      warning:
        input.requestCount > 0 && hitRate < 20
          ? 'Read model/cache reuse is low for this window.'
          : undefined,
    };
  }

  private buildRecommendations(
    requests: RuntimeRequestRecord[],
    queries: RuntimeQueryRecord[],
    reuse: {
      readModelHits: number;
      cacheHits: number;
      fallbackQueries: number;
      snapshotMisses: number;
      snapshotHits?: number;
    },
  ) {
    const recommendations: Array<{
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      message: string;
      evidence: Record<string, unknown>;
      recommendation: string;
    }> = [];
    const endpointRanking = this.rankEndpoints(requests, queries);
    const queryRanking = this.rankQueries(queries);

    for (const row of endpointRanking.byP95.slice(0, 5)) {
      if (row.averageSqlCount >= 20) {
        recommendations.push({
          type: 'HIGH_SQL_COUNT',
          severity: row.averageSqlCount >= 50 ? 'HIGH' : 'MEDIUM',
          message: `${row.method} ${row.endpoint} has high average SQL count.`,
          evidence: {
            averageSqlCount: row.averageSqlCount,
            requestCount: row.requestCount,
          },
          recommendation: 'Batch queries or move endpoint to a read model.',
        });
      }

      if (row.p95LatencyMs > row.averageLatencyMs * 2 && row.requestCount >= 5) {
        recommendations.push({
          type: 'LATENCY_SPIKE',
          severity: 'MEDIUM',
          message: `${row.method} ${row.endpoint} has p95 latency much higher than average.`,
          evidence: {
            averageLatencyMs: row.averageLatencyMs,
            p95LatencyMs: row.p95LatencyMs,
          },
          recommendation: 'Inspect slow queries and payload size for this endpoint.',
        });
      }
    }

    for (const row of queryRanking.byExecutionCount.slice(0, 5)) {
      if (row.executionCount >= 25) {
        recommendations.push({
          type: 'DUPLICATE_LOOKUP',
          severity: row.executionCount >= 100 ? 'HIGH' : 'MEDIUM',
          message: `${row.model}.${row.action} executes frequently in the current window.`,
          evidence: {
            executionCount: row.executionCount,
            averageTimeMs: row.averageTimeMs,
          },
          recommendation: 'Add request-level caching, batching, or repository preloading.',
        });
      }
    }

    const readModel = this.readModelEffectiveness({
      requestCount: requests.length,
      queryCount: queries.length,
      ...reuse,
    });
    if (requests.length >= 5 && readModel.hitRate < 20) {
      recommendations.push({
        type: 'LOW_READ_MODEL_EFFECTIVENESS',
        severity: 'MEDIUM',
        message: 'Read model/cache hit rate is low.',
        evidence: {
          hitRate: readModel.hitRate,
          readModelHits: readModel.readModelHits,
          cacheHits: readModel.cacheHits,
          snapshotHits: readModel.snapshotHits,
        },
        recommendation:
          'Increase snapshot coverage or ensure cockpit endpoints reuse existing read models.',
      });
    }

    return recommendations;
  }

  private performanceScoreByModule(requests: RuntimeRequestRecord[]) {
    const grouped = new Map<string, RuntimeRequestRecord[]>();
    for (const request of requests) {
      const module = this.moduleFromEndpoint(request.endpoint);
      grouped.set(module, [...(grouped.get(module) ?? []), request]);
    }

    return Array.from(grouped.entries()).map(([module, rows]) => {
      const avgLatency = this.average(rows.map((row) => row.durationMs));
      const avgSqlCount = this.average(rows.map((row) => row.prismaQueryCount));
      const slowQueries = rows.filter((row) => row.longestSqlMs > 200).length;
      const budgetExceeded = rows.filter((row) => row.budgetExceeded).length;
      const score = Math.max(
        0,
        Math.round(
          100 -
            Math.min(40, avgLatency / 25) -
            Math.min(25, avgSqlCount) -
            Math.min(20, slowQueries * 5) -
            Math.min(15, budgetExceeded * 5),
        ),
      );

      return {
        module,
        score,
        requestCount: rows.length,
        averageLatencyMs: avgLatency,
        averageSqlCount: avgSqlCount,
        slowQueryRequests: slowQueries,
        budgetExceeded,
      };
    });
  }

  private architectureScoreByModule(
    requests: RuntimeRequestRecord[],
    reuse: {
      readModelHits: number;
      cacheHits: number;
      fallbackQueries: number;
      snapshotMisses: number;
      snapshotHits?: number;
    },
  ) {
    const modules = this.performanceScoreByModule(requests);

    return modules.map((row) => {
      const readModelScore =
        reuse.readModelHits + reuse.cacheHits + (reuse.snapshotHits ?? 0) > 0
          ? 20
          : 0;
      const nPlusOnePenalty = row.averageSqlCount >= 20 ? 20 : 0;
      const budgetPenalty = row.budgetExceeded > 0 ? 15 : 0;
      const score = Math.max(
        0,
        Math.min(100, 60 + readModelScore - nPlusOnePenalty - budgetPenalty),
      );

      return {
        module: row.module,
        score,
        repositoryCoverage: 'not runtime-measured',
        readModelCoverage: readModelScore > 0 ? 'observed' : 'not observed',
        queryBudget: row.budgetExceeded > 0 ? 'exceeded' : 'within observed window',
        nPlusOneStatus:
          row.averageSqlCount >= 20 ? 'risk observed' : 'no runtime signal',
      };
    });
  }

  private moduleFromEndpoint(endpoint: string) {
    const normalized = `${endpoint}`.toLowerCase();
    if (normalized.includes('inventory')) return 'Inventory';
    if (normalized.includes('project')) return 'Projects';
    if (normalized.includes('logistics') || normalized.includes('dispatch')) {
      return 'Logistics';
    }
    if (normalized.includes('dashboard')) return 'Dashboard';
    if (normalized.includes('production')) return 'Production';
    if (normalized.includes('yard')) return 'Yard';
    if (normalized.includes('qc')) return 'QC';
    if (normalized.includes('component')) return 'Components';
    if (normalized.includes('supplier') || normalized.includes('purchase')) {
      return 'Suppliers';
    }
    return 'System';
  }

  private average(values: number[]) {
    if (values.length === 0) return 0;
    return Math.round(
      values.reduce((sum, value) => sum + Number(value ?? 0), 0) /
        values.length,
    );
  }

  private percentile(values: number[], percentile: number) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(
      sorted.length - 1,
      Math.ceil((percentile / 100) * sorted.length) - 1,
    );
    return Math.round(sorted[index] ?? 0);
  }

  private slowQueryLogPath() {
    if (process.env.RUNTIME_SLOW_QUERY_LOG_PATH) {
      return process.env.RUNTIME_SLOW_QUERY_LOG_PATH;
    }

    if (process.cwd().endsWith('apps/backend-api')) {
      return resolve(process.cwd(), '../../docs/runtime/slow-query.log');
    }

    return resolve(process.cwd(), 'docs/runtime/slow-query.log');
  }
}
