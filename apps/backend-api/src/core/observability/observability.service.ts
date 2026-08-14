import { Injectable } from '@nestjs/common';
import { BackgroundJobStatus, SnapshotJobStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

type HttpMetric = {
  count: number;
  durationMs: number;
};

@Injectable()
export class ObservabilityService {
  private readonly http = new Map<string, HttpMetric>();

  constructor(private readonly prisma: PrismaService) {}

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ) {
    const statusClass = `${Math.floor(statusCode / 100)}xx`;
    const key = JSON.stringify([method, route, statusClass]);
    const current = this.http.get(key) ?? { count: 0, durationMs: 0 };
    current.count += 1;
    current.durationMs += durationMs;
    this.http.set(key, current);
  }

  async renderPrometheus() {
    const operational = await this.operationalMetrics();
    const lines = [
      '# HELP steeltrack_process_uptime_seconds Process uptime.',
      '# TYPE steeltrack_process_uptime_seconds gauge',
      `steeltrack_process_uptime_seconds ${Math.floor(process.uptime())}`,
      '# HELP steeltrack_database_up Database connectivity state.',
      '# TYPE steeltrack_database_up gauge',
      `steeltrack_database_up ${operational.databaseUp}`,
      '# HELP steeltrack_projection_failures_active Active projection failures.',
      '# TYPE steeltrack_projection_failures_active gauge',
      `steeltrack_projection_failures_active ${operational.projectionFailures}`,
      '# HELP steeltrack_projection_lag_max_milliseconds Maximum projection lag.',
      '# TYPE steeltrack_projection_lag_max_milliseconds gauge',
      `steeltrack_projection_lag_max_milliseconds ${operational.projectionLagMs}`,
      '# HELP steeltrack_snapshot_jobs_failed Failed snapshot jobs.',
      '# TYPE steeltrack_snapshot_jobs_failed gauge',
      `steeltrack_snapshot_jobs_failed ${operational.snapshotFailures}`,
      '# HELP steeltrack_worker_jobs_failed Failed or dead-letter worker jobs.',
      '# TYPE steeltrack_worker_jobs_failed gauge',
      `steeltrack_worker_jobs_failed ${operational.workerFailures}`,
      '# HELP steeltrack_http_requests_total HTTP requests by method, route and status class.',
      '# TYPE steeltrack_http_requests_total counter',
      '# HELP steeltrack_http_request_duration_milliseconds_total Accumulated HTTP request duration.',
      '# TYPE steeltrack_http_request_duration_milliseconds_total counter',
    ];

    for (const [key, metric] of this.http) {
      const [method, route, statusClass] = JSON.parse(key) as string[];
      const labels = `method="${escapeLabel(method)}",route="${escapeLabel(route)}",status_class="${escapeLabel(statusClass)}"`;
      lines.push(`steeltrack_http_requests_total{${labels}} ${metric.count}`);
      lines.push(
        `steeltrack_http_request_duration_milliseconds_total{${labels}} ${metric.durationMs}`,
      );
    }

    return `${lines.join('\n')}\n`;
  }

  private async operationalMetrics() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const [projectionFailures, projectionLag, snapshotFailures, workerFailures] =
        await Promise.all([
          this.prisma.enterpriseProjectionFailure.count({
            where: { resolvedAt: null },
          }),
          this.prisma.enterpriseProjectionCheckpoint.aggregate({
            _max: { lagMs: true },
          }),
          this.prisma.snapshotJob.count({
            where: { status: SnapshotJobStatus.FAILED },
          }),
          this.prisma.backgroundJob.count({
            where: {
              status: {
                in: [BackgroundJobStatus.FAILED, BackgroundJobStatus.DEAD_LETTER],
              },
            },
          }),
        ]);

      return {
        databaseUp: 1,
        projectionFailures,
        projectionLagMs: projectionLag._max.lagMs ?? 0,
        snapshotFailures,
        workerFailures,
      };
    } catch {
      return {
        databaseUp: 0,
        projectionFailures: 0,
        projectionLagMs: 0,
        snapshotFailures: 0,
        workerFailures: 0,
      };
    }
  }
}

function escapeLabel(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
