# EPIC112 INV.CORE.1 - Inventory Operations Center Report

Date: 2026-07-08

## Scope

Operations Center integration was extended without UI redesign or API contract removal.

`GET /operations-center/overview` now includes an `inventory` section with module-specific platform health.

## Added Signals

Inventory health groups:

- Repository health.
- Read model health.
- Snapshot health.
- Event/outbox health.
- Background job health.
- Cache/read-model hit-rate signal.
- Inventory operational counts.

## Response Shape Addition

The endpoint keeps all existing fields and adds:

```json
{
  "inventory": {
    "repository": {},
    "readModel": {},
    "snapshot": {},
    "event": {},
    "jobs": {},
    "cache": {},
    "counts": {}
  }
}
```

This is additive and does not remove or rename existing fields.

## Repository Health

Reports:

- coverage percentage;
- status;
- repository boundary detail.

Current status:

```text
healthy
```

## Read Model Health

Uses runtime read-model effectiveness metrics.

Current limitation:

- Runtime metrics are process-local and reset on backend restart.

## Snapshot Health

Uses:

- `inventory_dashboard_snapshots` count;
- newest snapshot `updatedAt`;
- runtime snapshot hits/misses/fallbacks.

Status rules:

- `critical` when no Inventory dashboard snapshot exists.
- `warning` when newest snapshot is older than 1 hour.
- `healthy` otherwise.

## Event / Outbox Health

Counts Inventory-prefixed outbox events:

- pending/dispatching/failed;
- failed/dead-letter.

Status rules:

- `warning` if any Inventory outbox events failed or dead-lettered.
- `healthy` otherwise.

## Background Job Health

Counts background jobs whose name or queue references Inventory.

Status rules:

- `warning` if any Inventory jobs failed or dead-lettered.
- `healthy` otherwise.

## Verification

- Backend build passed.

