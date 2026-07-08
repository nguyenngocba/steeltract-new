# EPIC108 - Performance Benchmark Framework

Date: 2026-07-08

## Scope

Created a backend benchmark framework for controlled runtime-vs-snapshot measurement.

Backend service:

```text
apps/backend-api/src/core/validation/performance-benchmark.service.ts
```

## Supported Classes

- Dashboard
- Detail
- Search
- Lookup

## Supported Sources

- Runtime
- Snapshot

## Metrics

For every benchmark case:

- iterations
- average latency
- p95
- p99
- max
- min
- failure count

SQL count and SQL time are captured by the existing runtime metrics interceptor/profiler when the benchmark runs inside a request or measured context.

## Usage Pattern

```ts
benchmark.run([
  {
    name: 'inventory-dashboard-runtime',
    class: 'dashboard',
    source: 'runtime',
    iterations: 10,
    run: () => runtimeReader(),
  },
  {
    name: 'inventory-dashboard-snapshot',
    class: 'dashboard',
    source: 'snapshot',
    iterations: 10,
    run: () => snapshotReader(),
  },
])
```

## Current Status

The framework is implemented but not exposed as a public API. EPIC109 Operations Center can call it from an admin-only runtime panel.

