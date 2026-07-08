import { Injectable } from '@nestjs/common';

export type BenchmarkClass = 'dashboard' | 'detail' | 'search' | 'lookup';
export type BenchmarkSource = 'runtime' | 'snapshot';

export interface BenchmarkCase<TResult = unknown> {
  name: string;
  class: BenchmarkClass;
  source: BenchmarkSource;
  iterations?: number;
  run: () => Promise<TResult>;
}

export interface BenchmarkResult {
  name: string;
  class: BenchmarkClass;
  source: BenchmarkSource;
  iterations: number;
  averageMs: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  minMs: number;
  failures: number;
}

@Injectable()
export class PerformanceBenchmarkService {
  async run(cases: BenchmarkCase[]) {
    const results: BenchmarkResult[] = [];

    for (const benchmarkCase of cases) {
      results.push(await this.runCase(benchmarkCase));
    }

    return {
      generatedAt: new Date().toISOString(),
      results,
      summary: this.summary(results),
    };
  }

  private async runCase(benchmarkCase: BenchmarkCase): Promise<BenchmarkResult> {
    const durations: number[] = [];
    let failures = 0;
    const iterations = Math.max(1, benchmarkCase.iterations ?? 5);

    for (let index = 0; index < iterations; index += 1) {
      const startedAt = Date.now();
      try {
        await benchmarkCase.run();
      } catch {
        failures += 1;
      } finally {
        durations.push(Date.now() - startedAt);
      }
    }

    const sorted = [...durations].sort((a, b) => a - b);

    return {
      name: benchmarkCase.name,
      class: benchmarkCase.class,
      source: benchmarkCase.source,
      iterations,
      averageMs: this.average(durations),
      p95Ms: this.percentile(sorted, 95),
      p99Ms: this.percentile(sorted, 99),
      maxMs: Math.max(...durations, 0),
      minMs: Math.min(...durations, 0),
      failures,
    };
  }

  private summary(results: BenchmarkResult[]) {
    return {
      totalCases: results.length,
      totalIterations: results.reduce((sum, row) => sum + row.iterations, 0),
      failures: results.reduce((sum, row) => sum + row.failures, 0),
      slowest: [...results].sort((a, b) => b.p95Ms - a.p95Ms)[0] ?? null,
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

  private percentile(sorted: number[], percentile: number) {
    if (sorted.length === 0) {
      return 0;
    }

    const index = Math.min(
      sorted.length - 1,
      Math.ceil((percentile / 100) * sorted.length) - 1,
    );

    return sorted[index] ?? 0;
  }
}
