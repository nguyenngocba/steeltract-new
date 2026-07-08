# EPIC108 - Stress Test Foundation

Date: 2026-07-08

## Scope

Created a backend controlled-load harness without adding public endpoints or fake production data.

Backend service:

```text
apps/backend-api/src/core/validation/stress-harness.service.ts
```

## Supported Load Classes

- Dashboard load
- Detail load
- Search load
- Lookup load

## Inputs

Each stress case accepts:

- name
- class
- concurrency
- request count
- async run callback

## Metrics

For every case:

- concurrency
- request count
- average latency
- p95
- p99
- failures

## Usage Pattern

```ts
stressHarness.run([
  {
    name: 'dashboard-cockpit-load',
    class: 'dashboard',
    concurrency: 10,
    requests: 100,
    run: () => dashboardReader(),
  },
])
```

## Safety

The harness does not create records by itself.

Callers decide which read-only workload to execute. For production-like environments, use only read endpoints/read services unless a dedicated disposable test database is available.

