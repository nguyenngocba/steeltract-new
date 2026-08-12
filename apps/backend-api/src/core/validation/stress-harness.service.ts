import { Injectable } from '@nestjs/common';

import type { BenchmarkClass } from './performance-benchmark.service';

export interface StressCase<TResult = unknown> {
  name: string;
  class: BenchmarkClass;
  concurrency?: number;
  requests?: number;
  run: () => Promise<TResult>;
}

@Injectable()
export class StressHarnessService {
  async run(cases: StressCase[]) {
    const results = [];

    for (const stressCase of cases) {
      results.push(await this.runCase(stressCase));
    }

    return {
      generatedAt: new Date().toISOString(),
      results,
    };
  }

  private async runCase(stressCase: StressCase) {
    const concurrency = Math.max(1, stressCase.concurrency ?? 5);
    const requests = Math.max(1, stressCase.requests ?? concurrency);
    const durations: number[] = [];
    let failures = 0;
    let cursor = 0;

    const worker = async () => {
      while (cursor < requests) {
        cursor += 1;
        const startedAt = Date.now();
        try {
          await stressCase.run();
        } catch {
          failures += 1;
        } finally {
          durations.push(Date.now() - startedAt);
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    return {
      name: stressCase.name,
      class: stressCase.class,
      concurrency,
      requests,
      averageMs: this.average(durations),
      p95Ms: this.percentile(durations, 95),
      p99Ms: this.percentile(durations, 99),
      failures,
    };
  }

  private average(values: number[]) {
    if (values.length === 0) {
      return 0;
    }

    return Math.round(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    );
  }

  private percentile(values: number[], percentile: number) {
    if (values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(
      sorted.length - 1,
      Math.ceil((percentile / 100) * sorted.length) - 1,
    );

    return sorted[index] ?? 0;
  }
}
