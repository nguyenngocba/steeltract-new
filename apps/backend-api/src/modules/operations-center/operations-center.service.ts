import {
  Injectable,
} from '@nestjs/common';
import { statfsSync } from 'fs';
import { cpus, freemem, loadavg, totalmem } from 'os';

import { CacheService } from '../../core/performance/cache.service';
import { PerformanceMetricsService } from '../../core/performance/performance-metrics.service';
import { InventoryRepository } from '../inventory/inventory.repository';
import { OperationsCenterRepository } from './operations-center.repository';

type HealthTone = 'healthy' | 'warning' | 'critical' | 'unknown';

@Injectable()
export class OperationsCenterService {
  constructor(
    private readonly repository: OperationsCenterRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly cache: CacheService,
    private readonly metrics: PerformanceMetricsService,
  ) {}

  async overview() {
    const [
      jobCounts,
      recentJobs,
      outboxCounts,
      recentEvents,
      snapshotRows,
      tableCounts,
      databaseSize,
      inventoryHealth,
      projectHealth,
    ] = await Promise.all([
      this.repository.countBackgroundJobsByStatus(),
      this.repository.recentBackgroundJobs(),
      this.repository.countOutboxEventsByStatus(),
      this.repository.recentOutboxEvents(),
      this.repository.snapshotStats(),
      this.repository.databaseTableCounts(),
      this.repository.databaseSize(),
      this.inventoryRepository.inventoryPlatformHealth(),
      this.repository.projectPlatformHealth(),
    ]);
    const runtime = this.metrics.snapshot();
    const analytics = this.asRecord(runtime.analytics);
    const windows = this.asRecord(analytics.windows);
    const activeWindow =
      this.asRecord(windows['24h']) ||
      this.asRecord(windows['1h']) ||
      this.asRecord(windows['5m']) ||
      {};
    const endpointRanking = this.asRecord(activeWindow.endpointRanking);
    const queryRanking = this.asRecord(activeWindow.queryRanking);
    const readModel = this.asRecord(activeWindow.readModelEffectiveness);
    const performanceScore = this.asRecord(activeWindow.performanceScore);
    const architectureScore = this.asRecord(activeWindow.architectureScore);
    const memory = this.asRecord(runtime.memory);
    const requests = this.asRecord(runtime.requests);
    const queries = this.asRecord(runtime.queries);
    const snapshots = this.asRecord(runtime.snapshots);
    const cacheRuntime = this.asRecord(runtime.cache);
    const cacheStats = this.cache.stats();
    const systemMemory = this.systemMemory();
    const disk = this.diskUsage(process.env.STORAGE_ROOT ?? '/data/steeltrack-storage');
    const databaseBytes = Number(databaseSize[0]?.sizeBytes ?? 0);
    const snapshotHealth = this.snapshotHealth(snapshotRows);
    const jobs = this.statusMap(jobCounts);
    const events = this.statusMap(outboxCounts);
    const alerts = this.alerts({
      jobs,
      events,
      snapshotHealth,
      readModel,
      queries,
      disk,
      systemMemory,
    });

    return {
      generatedAt: new Date().toISOString(),
      systemHealth: [
        {
          id: 'cpu',
          label: 'CPU',
          status: this.cpuStatus(),
          value: `${loadavg()[0].toFixed(2)} load`,
          detail: `${cpus().length} cores`,
        },
        {
          id: 'ram',
          label: 'RAM',
          status: systemMemory.status,
          value: `${systemMemory.usedPercent}%`,
          detail: `${this.formatBytes(systemMemory.usedBytes)} / ${this.formatBytes(systemMemory.totalBytes)}`,
        },
        {
          id: 'disk',
          label: 'Disk',
          status: disk.status,
          value: disk.available ? `${disk.usedPercent}%` : 'N/A',
          detail: disk.available
            ? `${this.formatBytes(disk.usedBytes)} / ${this.formatBytes(disk.totalBytes)}`
            : disk.error,
        },
        {
          id: 'database',
          label: 'Database',
          status: 'healthy',
          value: this.formatBytes(databaseBytes),
          detail: 'PostgreSQL reachable',
        },
        {
          id: 'worker',
          label: 'Worker',
          status: Number(jobs.FAILED ?? 0) + Number(jobs.DEAD_LETTER ?? 0) > 0 ? 'warning' : 'healthy',
          value: `${Number(jobs.RUNNING ?? 0)} running`,
          detail: `${Number(jobs.QUEUED ?? 0)} waiting · ${Number(jobs.RETRYING ?? 0)} retry`,
        },
        {
          id: 'snapshot',
          label: 'Snapshot',
          status: snapshotHealth.some((row) => row.status === 'critical') ? 'critical' : snapshotHealth.some((row) => row.status === 'warning') ? 'warning' : 'healthy',
          value: `${Number(snapshots.hits ?? 0)} hit`,
          detail: `${Number(snapshots.misses ?? 0)} miss · ${Number(snapshots.fallbacks ?? 0)} fallback`,
        },
        {
          id: 'cache',
          label: 'Cache',
          status: 'healthy',
          value: `${Number(readModel.hitRate ?? 0)}%`,
          detail: `${cacheStats.entries} entries · ${Number(cacheRuntime.hits ?? 0)} hits`,
        },
        {
          id: 'event',
          label: 'Event',
          status: Number(events.FAILED ?? 0) + Number(events.DEAD_LETTER ?? 0) > 0 ? 'warning' : 'healthy',
          value: `${Number(events.PENDING ?? 0)} pending`,
          detail: `${Number(events.DISPATCHED ?? 0)} dispatched`,
        },
      ],
      runtime: {
        uptimeSeconds: Number(runtime.uptimeSeconds ?? 0),
        requestCount: Number(requests.count ?? 0),
        averageResponseMs: Number(requests.avgResponseMs ?? 0),
        slowRequestCount: Number(requests.slowRequestCount ?? 0),
        slowQueryCount: Number(queries.slowQueryCount ?? 0),
        memory: {
          heapUsedBytes: Number(memory.heapUsed ?? 0),
          heapTotalBytes: Number(memory.heapTotal ?? 0),
          rssBytes: Number(memory.rss ?? 0),
          peakHeapUsedBytes: Number(memory.peakHeapUsed ?? 0),
        },
      },
      performanceScore,
      architectureScore,
      apiRanking: {
        byAverage: this.asArray(endpointRanking.byAverage).slice(0, 8),
        byP95: this.asArray(endpointRanking.byP95).slice(0, 8),
        byRequestCount: this.asArray(endpointRanking.byRequestCount).slice(0, 8),
      },
      queryRanking: {
        byAverage: this.asArray(queryRanking.byAverage).slice(0, 8),
        byExecutionCount: this.asArray(queryRanking.byExecutionCount).slice(0, 8),
      },
      jobs: {
        counts: jobs,
        recent: recentJobs,
      },
      snapshots: {
        runtime: snapshots,
        modules: snapshotHealth,
      },
      cache: {
        ...cacheStats,
        hitRate: Number(readModel.hitRate ?? 0),
        hits: Number(cacheRuntime.hits ?? 0),
        readModelHits: Number(readModel.readModelHits ?? 0),
        snapshotHits: Number(readModel.snapshotHits ?? 0),
        snapshotMisses: Number(readModel.snapshotMisses ?? 0),
        fallbackQueries: Number(readModel.fallbackQueries ?? 0),
      },
      database: {
        sizeBytes: databaseBytes,
        tables: this.tableRows(tableCounts),
      },
      storage: {
        databaseBytes,
        attachmentBytes: disk.available ? disk.usedBytes : null,
        storageRoot: process.env.STORAGE_ROOT ?? '/data/steeltrack-storage',
        filesystem: disk,
      },
      events: {
        counts: events,
        recent: recentEvents,
      },
      inventory: this.inventoryHealth(inventoryHealth, snapshots, readModel, events, jobs),
      projects: this.projectHealth(projectHealth, snapshots, readModel, events, jobs),
      alerts,
    };
  }

  private inventoryHealth(
    health: Awaited<ReturnType<InventoryRepository['inventoryPlatformHealth']>>,
    snapshots: Record<string, unknown>,
    readModel: Record<string, unknown>,
    events: Record<string, number>,
    jobs: Record<string, number>,
  ) {
    const snapshotAgeSeconds = health.latestSnapshotAt
      ? Math.round((Date.now() - health.latestSnapshotAt.getTime()) / 1000)
      : null;
    const materialSnapshotAgeSeconds = health.latestMaterialSnapshotAt
      ? Math.round((Date.now() - health.latestMaterialSnapshotAt.getTime()) / 1000)
      : null;
    const locationSnapshotAgeSeconds = health.latestLocationSnapshotAt
      ? Math.round((Date.now() - health.latestLocationSnapshotAt.getTime()) / 1000)
      : null;
    const snapshotStatus =
      health.snapshotCount === 0
        ? 'critical'
        : snapshotAgeSeconds !== null && snapshotAgeSeconds > 3600
          ? 'warning'
          : 'healthy';
    const materialSnapshotStatus =
      health.materialSnapshotCount === 0
        ? 'critical'
        : materialSnapshotAgeSeconds !== null && materialSnapshotAgeSeconds > 3600
          ? 'warning'
          : 'healthy';
    const locationSnapshotStatus =
      health.locationSnapshotCount === 0
        ? 'critical'
        : locationSnapshotAgeSeconds !== null && locationSnapshotAgeSeconds > 3600
          ? 'warning'
          : 'healthy';
    const snapshotHits = Number(snapshots.hits ?? 0);
    const snapshotMisses = Number(snapshots.misses ?? 0);
    const snapshotTotal = snapshotHits + snapshotMisses;

    return {
      repository: {
        status: 'healthy',
        coverage: 100,
        detail: 'Inventory persistence is routed through InventoryRepository.',
      },
      readModel: {
        status: Number(readModel.hitRate ?? 0) > 0 ? 'healthy' : 'unknown',
        hitRate: Number(readModel.hitRate ?? 0),
        detail: 'Material Detail and Inventory Audit use repository-backed read-model services.',
      },
      snapshot: {
        status: snapshotStatus,
        count: health.snapshotCount,
        latestSnapshotAt: health.latestSnapshotAt?.toISOString() ?? null,
        ageSeconds: snapshotAgeSeconds,
        runtimeHits: snapshotHits,
        runtimeMisses: snapshotMisses,
        runtimeFallbacks: Number(snapshots.fallbacks ?? 0),
        hitRatio:
          snapshotTotal > 0 ? Math.round((snapshotHits / snapshotTotal) * 100) : 0,
        averageLagMs: Number(snapshots.averageLagMs ?? 0),
        maxLagMs: Number(snapshots.maxLagMs ?? 0),
        material: {
          status: materialSnapshotStatus,
          count: health.materialSnapshotCount,
          latestSnapshotAt:
            health.latestMaterialSnapshotAt?.toISOString() ?? null,
          ageSeconds: materialSnapshotAgeSeconds,
          hits: Number(snapshots.materialSnapshotHit ?? 0),
          misses: Number(snapshots.materialSnapshotMiss ?? 0),
        },
        location: {
          status: locationSnapshotStatus,
          count: health.locationSnapshotCount,
          latestSnapshotAt:
            health.latestLocationSnapshotAt?.toISOString() ?? null,
          ageSeconds: locationSnapshotAgeSeconds,
          hits: Number(snapshots.locationSnapshotHit ?? 0),
          misses: Number(snapshots.locationSnapshotMiss ?? 0),
        },
        rebuild: {
          count: Number(snapshots.rebuilds ?? 0),
          averageDurationMs: Number(snapshots.averageRebuildMs ?? 0),
        },
      },
      event: {
        status: health.failedOutbox > 0 ? 'warning' : 'healthy',
        pendingOutbox: health.pendingOutbox,
        failedOutbox: health.failedOutbox,
        globalPending: Number(events.PENDING ?? 0),
      },
      jobs: {
        status: health.failedJobs > 0 ? 'warning' : 'healthy',
        activeJobs: health.activeJobs,
        failedJobs: health.failedJobs,
        globalRunning: Number(jobs.RUNNING ?? 0),
      },
      cache: {
        status: 'healthy',
        hitRate: Number(readModel.hitRate ?? 0),
      },
      counts: {
        itemCount: health.itemCount,
        transactionCount: health.transactionCount,
        locationStockCount: health.locationStockCount,
        returnRequestCount: health.returnRequestCount,
      },
    };
  }

  private projectHealth(
    health: Awaited<ReturnType<OperationsCenterRepository['projectPlatformHealth']>>,
    snapshots: Record<string, unknown>,
    readModel: Record<string, unknown>,
    events: Record<string, number>,
    jobs: Record<string, number>,
  ) {
    const snapshotAgeSeconds = health.latestSnapshotAt
      ? Math.round((Date.now() - health.latestSnapshotAt.getTime()) / 1000)
      : null;
    const snapshotStatus =
      health.snapshotCount === 0
        ? 'critical'
        : snapshotAgeSeconds !== null && snapshotAgeSeconds > 3600
          ? 'warning'
          : 'healthy';
    const projectSnapshotHits = Number(snapshots.projectSnapshotHit ?? 0);
    const projectSnapshotMisses = Number(snapshots.projectSnapshotMiss ?? 0);
    const projectSnapshotTotal = projectSnapshotHits + projectSnapshotMisses;
    const detailSnapshotAgeSeconds = health.latestDetailSnapshotAt
      ? Math.round((Date.now() - health.latestDetailSnapshotAt.getTime()) / 1000)
      : null;
    const detailSnapshotStatus =
      health.detailSnapshotCount === 0
        ? 'critical'
        : health.staleDetailSnapshots > 0 || health.detailSnapshotWarnings > 0
          ? 'warning'
          : detailSnapshotAgeSeconds !== null && detailSnapshotAgeSeconds > 3600
            ? 'warning'
            : 'healthy';

    return {
      repository: {
        status: 'healthy',
        coverage: 95,
        detail: 'Project commands and reads are routed through ProjectsRepository, with remaining external reads isolated in OperationsCenterRepository.',
      },
      readModel: {
        status: Number(snapshots.projectReadModelHit ?? 0) > 0 ? 'healthy' : 'unknown',
        hits: Number(snapshots.projectReadModelHit ?? 0),
        fallbackCount: Number(snapshots.projectFallbackCount ?? 0),
        globalHitRate: Number(readModel.hitRate ?? 0),
      },
      snapshot: {
        status: snapshotStatus,
        count: health.snapshotCount,
        latestSnapshotAt: health.latestSnapshotAt?.toISOString() ?? null,
        ageSeconds: snapshotAgeSeconds,
        hits: projectSnapshotHits,
        misses: projectSnapshotMisses,
        hitRatio:
          projectSnapshotTotal > 0
            ? Math.round((projectSnapshotHits / projectSnapshotTotal) * 100)
            : 0,
        averageLagMs: Number(snapshots.averageLagMs ?? 0),
        maxLagMs: Number(snapshots.maxLagMs ?? 0),
        detail: {
          status: detailSnapshotStatus,
          count: health.detailSnapshotCount,
          latestSnapshotAt: health.latestDetailSnapshotAt?.toISOString() ?? null,
          ageSeconds: detailSnapshotAgeSeconds,
          staleCount: health.staleDetailSnapshots,
          parityWarnings: health.detailSnapshotWarnings,
          hits: Number(snapshots.projectDetailSnapshotHit ?? 0),
          fallbackCount: Number(snapshots.projectDetailFallback ?? 0),
          planningHits: Number(snapshots.planningSnapshotHit ?? 0),
          timelineHits: Number(snapshots.timelineSnapshotHit ?? 0),
          allocationHits: Number(snapshots.allocationSnapshotHit ?? 0),
          averageAgeSeconds: Number(snapshots.projectDetailAverageAgeSeconds ?? 0),
          averageLagMs: Number(snapshots.projectDetailAverageLagMs ?? 0),
        },
      },
      event: {
        status: health.failedOutbox > 0 ? 'warning' : 'healthy',
        pendingOutbox: health.pendingOutbox,
        failedOutbox: health.failedOutbox,
        globalPending: Number(events.PENDING ?? 0),
      },
      jobs: {
        status: health.failedJobs > 0 ? 'warning' : 'healthy',
        activeJobs: health.activeJobs,
        failedJobs: health.failedJobs,
        globalRunning: Number(jobs.RUNNING ?? 0),
      },
      runtime: {
        status: 'healthy',
        trackedByRuntimeMetrics: true,
      },
      counts: {
        projectCount: health.projectCount,
        taskCount: health.taskCount,
        templateCount: health.templateCount,
      },
    };
  }

  private snapshotHealth(rows: Awaited<ReturnType<OperationsCenterRepository['snapshotStats']>>) {
    const now = Date.now();
    return [
      this.snapshotModule('Inventory', Number(rows[0] ?? 0), rows[1]?.updatedAt, now),
      this.snapshotModule('Projects', Number(rows[2] ?? 0), rows[3]?.updatedAt, now),
      this.snapshotModule('Dispatch', Number(rows[4] ?? 0), rows[5]?.updatedAt, now),
    ];
  }

  private snapshotModule(label: string, count: number, updatedAt: Date | undefined, now: number) {
    const ageSeconds = updatedAt ? Math.round((now - updatedAt.getTime()) / 1000) : null;
    return {
      id: label.toLowerCase(),
      label,
      count,
      updatedAt: updatedAt?.toISOString() ?? null,
      ageSeconds,
      status: count === 0 ? 'critical' : ageSeconds !== null && ageSeconds > 3600 ? 'warning' : 'healthy',
    };
  }

  private tableRows(counts: number[]) {
    const labels = [
      'inventory_transactions',
      'inventory_transaction_items',
      'inventory_location_stocks',
      'projects',
      'project_tasks',
      'dispatch_orders',
      'background_jobs',
      'outbox_events',
      'attachments',
    ];
    return labels.map((table, index) => ({
      table,
      rows: counts[index] ?? 0,
    }));
  }

  private alerts(input: {
    jobs: Record<string, number>;
    events: Record<string, number>;
    snapshotHealth: Array<{ id: string; label: string; status: string; ageSeconds: number | null }>;
    readModel: Record<string, unknown>;
    queries: Record<string, unknown>;
    disk: ReturnType<OperationsCenterService['diskUsage']>;
    systemMemory: ReturnType<OperationsCenterService['systemMemory']>;
  }) {
    const alerts: Array<{
      id: string;
      severity: 'Critical' | 'Warning' | 'Information';
      title: string;
      description: string;
      source: string;
    }> = [];

    for (const snapshot of input.snapshotHealth) {
      if (snapshot.status === 'critical') {
        alerts.push({
          id: `snapshot-${snapshot.id}`,
          severity: 'Critical',
          title: `${snapshot.label} snapshot missing`,
          description: 'Dashboard will fallback to runtime aggregate.',
          source: 'Snapshot',
        });
      } else if (snapshot.status === 'warning') {
        alerts.push({
          id: `snapshot-${snapshot.id}-stale`,
          severity: 'Warning',
          title: `${snapshot.label} snapshot stale`,
          description: `Age ${snapshot.ageSeconds ?? 0}s exceeds 1 hour.`,
          source: 'Snapshot',
        });
      }
    }

    if ((input.jobs.FAILED ?? 0) + (input.jobs.DEAD_LETTER ?? 0) > 0) {
      alerts.push({
        id: 'jobs-failed',
        severity: 'Warning',
        title: 'Background jobs need attention',
        description: `${input.jobs.FAILED ?? 0} failed · ${input.jobs.DEAD_LETTER ?? 0} dead-letter.`,
        source: 'Background Jobs',
      });
    }

    if ((input.events.FAILED ?? 0) + (input.events.DEAD_LETTER ?? 0) > 0) {
      alerts.push({
        id: 'events-failed',
        severity: 'Warning',
        title: 'Outbox events need attention',
        description: `${input.events.FAILED ?? 0} failed · ${input.events.DEAD_LETTER ?? 0} dead-letter.`,
        source: 'Events',
      });
    }

    if (Number(input.readModel.hitRate ?? 0) < 20) {
      alerts.push({
        id: 'cache-low-hit',
        severity: 'Information',
        title: 'Read model/cache hit rate is low',
        description: `Current hit rate ${Number(input.readModel.hitRate ?? 0)}%.`,
        source: 'Cache',
      });
    }

    if (Number(input.queries.slowQueryCount ?? 0) > 0) {
      alerts.push({
        id: 'slow-query',
        severity: 'Warning',
        title: 'Slow queries detected',
        description: `${Number(input.queries.slowQueryCount ?? 0)} slow query observations in memory.`,
        source: 'API',
      });
    }

    if (input.disk.available && input.disk.usedPercent >= 85) {
      alerts.push({
        id: 'disk-pressure',
        severity: input.disk.usedPercent >= 95 ? 'Critical' : 'Warning',
        title: 'Storage usage is high',
        description: `${input.disk.usedPercent}% used at ${input.disk.path}.`,
        source: 'Storage',
      });
    }

    if (input.systemMemory.usedPercent >= 85) {
      alerts.push({
        id: 'memory-pressure',
        severity: input.systemMemory.usedPercent >= 95 ? 'Critical' : 'Warning',
        title: 'System memory usage is high',
        description: `${input.systemMemory.usedPercent}% RAM in use.`,
        source: 'Runtime',
      });
    }

    return alerts;
  }

  private statusMap(rows: Array<{ status: string; count: number }>) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});
  }

  private cpuStatus(): HealthTone {
    const oneMinuteLoad = loadavg()[0];
    const cores = Math.max(1, cpus().length);
    const ratio = oneMinuteLoad / cores;
    if (ratio >= 1.5) return 'critical';
    if (ratio >= 0.9) return 'warning';
    return 'healthy';
  }

  private systemMemory() {
    const totalBytes = totalmem();
    const freeBytes = freemem();
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
    return {
      totalBytes,
      freeBytes,
      usedBytes,
      usedPercent,
      status: usedPercent >= 95 ? 'critical' : usedPercent >= 85 ? 'warning' : 'healthy',
    };
  }

  private diskUsage(path: string) {
    try {
      const stat = statfsSync(path);
      const totalBytes = Number(stat.blocks) * Number(stat.bsize);
      const freeBytes = Number(stat.bavail) * Number(stat.bsize);
      const usedBytes = Math.max(0, totalBytes - freeBytes);
      const usedPercent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
      return {
        available: true as const,
        path,
        totalBytes,
        freeBytes,
        usedBytes,
        usedPercent,
        status: usedPercent >= 95 ? 'critical' as const : usedPercent >= 85 ? 'warning' as const : 'healthy' as const,
      };
    } catch (error) {
      return {
        available: false as const,
        path,
        totalBytes: 0,
        freeBytes: 0,
        usedBytes: 0,
        usedPercent: 0,
        status: 'unknown' as const,
        error: error instanceof Error ? error.message : 'Storage path unavailable',
      };
    }
  }

  private formatBytes(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return `${size >= 10 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }
}
