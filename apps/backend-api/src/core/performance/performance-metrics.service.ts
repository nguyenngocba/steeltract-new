import { Injectable } from '@nestjs/common';

export interface SlowQueryRecord {
  label: string;
  durationMs: number;
  occurredAt: string;
  metadata?: unknown;
}

@Injectable()
export class PerformanceMetricsService {
  private websocketEmitted = 0;
  private websocketDropped = 0;
  private websocketDeduped = 0;
  private readonly slowQueries: SlowQueryRecord[] = [];

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

  snapshot() {
    const memory = process.memoryUsage();

    return {
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
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
}
