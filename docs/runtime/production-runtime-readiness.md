# EPIC130 - Production Runtime Readiness

Date: 2026-07-11
Status: PARTIAL

## Runtime Metrics

Production is covered by global runtime observability:

- HTTP request metrics;
- Prisma query profiler;
- query budget warnings;
- slow query detection;
- process memory samples.

Production does not yet have module-specific counters equivalent to Inventory/Projects:

- `productionSnapshotHit`;
- `productionSnapshotMiss`;
- `productionSnapshotLag`;
- `productionSnapshotAge`;
- `productionReadModelHit`;
- `productionFallbackCount`;
- `productionBackgroundJobLag`.

## Snapshot Readiness

Missing implementation:

- Prisma snapshot models for Production dashboard/order/work-center summaries;
- Production snapshot repository;
- Production dashboard reader via `DashboardReaderService`;
- feature flags such as `USE_PRODUCTION_SNAPSHOT`;
- snapshot freshness/confidence rules;
- snapshot parity validator;
- snapshot writer/rebuilder branches;
- event consumer mappings from `production.*` events to snapshot update jobs.

Current `SnapshotFeatureFlagService` supports only:

- `inventory`;
- `projects`;
- `logistics`.

## Event / Outbox Readiness

Existing persisted Production event examples:

- `production.started`;
- `production.stage.completed`;
- `production.delayed`;
- `production.completed`;
- `production.staged.to-yard`.

Missing:

- `production.order.created`;
- `production.order.updated`;
- `production.material.reserved`;
- `production.material.issued`;
- `production.material.returned`;
- `production.material.consumed`;
- `production.scrap.recorded`;
- `production.rework.recorded`;
- event-to-snapshot mapping in `EventConsumerService`.

## Background Engine Readiness

Core background services exist and can process `snapshot.*` jobs. Production does not yet schedule or rebuild Production snapshots.

Required future job scopes:

- `snapshot.production.dashboard`;
- `snapshot.production.order`;
- `snapshot.production.work-center`;
- `snapshot.production.capacity`;
- `snapshot.production.oee`.

## Operations Center Readiness

Operations Center currently exposes detailed platform health for:

- Inventory;
- Projects;
- Dispatch / Logistics snapshots.

Production health is not yet registered. Future additive health should include:

- Repository Health;
- Read Model Health;
- Snapshot Health;
- Event/Outbox Health;
- Background Job Health;
- Runtime Health;
- slow endpoint and slow query ranking scoped to Production.

## Large-Data Runtime Risks

| Area | Risk | Recommendation |
| --- | --- | --- |
| Production Orders | Frontend currently requests the unparameterized orders endpoint in the main hook. | Move cockpit table to server-side pagination before high volume. |
| Logs | Backend caps logs at 200. | Add server-side pagination and date filters. |
| Material Ledger | Backend supports filters, but frontend still treats result as array. | Add pagination metadata before ledger growth. |
| Cockpit Analytics | Frontend computes many overview metrics from live arrays. | Move dashboard-only metrics to persisted snapshots. |
| Reservation/Issue workflows | Services compose stock and reservation data directly. | Move reads into repository-backed live read models with query budgets. |

## Verdict

Production Runtime Readiness: **PARTIAL**

Production has global observability and some persistent events, but it does not yet have Production-specific snapshot/runtime/read-model metrics or Operations Center platform health.

