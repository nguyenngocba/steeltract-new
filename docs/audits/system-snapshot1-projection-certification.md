# SYSTEM.SNAPSHOT.1 - Canonical Snapshot & Projection Certification

Date: 2026-08-11 (Asia/Ho_Chi_Minh)  
Decision: **NO-GO**  
Mode: certification only; no business, API, schema, migration or UI change.

## Executive Result

The live operational workspaces render and return real data, and the initialized
projection workers have no active failure, duplicate snapshot identity or
orphan projection document. The canonical chain is nevertheless not certified:

```text
Live read model        PASS
Projection health      PARTIAL
Historical snapshot   FAIL
Dashboard parity       FAIL
Executive snapshot    FAIL
```

`GET /history/dashboard/latest` returns `404`, only Inventory and Yard have
historical dashboard rows, those rows are stale relative to current business
data while marked authoritative/non-stale, and no balance or monthly rollup
rows exist.

## Runtime Environment

- Backend: current working tree, Nest runtime on `127.0.0.1:3100`.
- Frontend: Vite/Chromium on `127.0.0.1:4173`.
- Authentication: real `admin` JWT through `POST /auth/login` (`201`).
- Evidence:
  - `/tmp/system-snapshot1-runtime-evidence.json`
  - `/tmp/system-snapshot1-database-evidence.json`
  - `test-results/snapshot-cert1/browser-evidence.json`
  - eight screenshots under `test-results/snapshot-cert1/`

## REST Evidence

| Endpoint / module | HTTP | Snapshot date | Result |
|---|---:|---|---|
| `/history/dashboard/latest` (default ERP) | 404 | - | **FAIL P0** |
| `module=ERP` | 404 | - | FAIL |
| `module=INVENTORY` | 200 | 2026-08-11 | Available, parity FAIL |
| `module=PRODUCTION` | 404 | - | FAIL |
| `module=QC` | 404 | - | FAIL |
| `module=PROJECTS` | 404 | - | FAIL |
| `module=YARD` | 200 | 2026-08-11 | Available, parity FAIL |
| `module=LOGISTICS` | 404 | - | FAIL |
| `module=DISPATCH` | 404 | - | FAIL |

All live endpoints returned `200`: Inventory Overview, Production Cockpit, QC
Dashboard, Projects Runtime, Yard Dashboard, Logistics Dispatch Dashboard and
Executive Cockpit.

## KPI Parity

| Domain | Live read model | Historical snapshot | Result |
|---|---|---|---|
| Inventory materials | 23 | 1 | FAIL |
| Inventory stock | 3,025 | 0 | FAIL |
| Production orders | 28 | no snapshot | FAIL |
| QC inspections / open NCR | 56 / 28 | no snapshot | FAIL |
| Projects | 22 | no snapshot | FAIL |
| Yard active placements | 25 | 0 | FAIL |
| Logistics completed / movements today | 4 / 11 | no snapshot | FAIL |
| Executive | live response available | ERP latest is 404 | FAIL |

This is not a numeric rounding issue. The Inventory and Yard historical rows
were generated at `2026-08-10T17:00:00Z`, before the retained runtime workflows
written around `2026-08-11T07:06Z`, and were not refreshed afterward.

## Database Evidence

Historical layer:

- `dashboard_snapshots`: 4 rows total; modules are only `INVENTORY` and `YARD`.
- `inventory_balance_snapshots`: 0 rows.
- `dashboard_monthly_rollups`: 0 rows.
- `inventory_monthly_rollups`: 0 rows.
- `snapshot_jobs`: 6 `COMPLETED`, 0 `FAILED`, 0 `RUNNING`.
- `snapshot_metadata`: three enabled definitions, only Inventory dashboard,
  Inventory balance and Yard dashboard.
- Duplicate `(module, scope_key, snapshot_date)` identities: 0.

Operational snapshots are materially newer and populated:

- Inventory: 23 materials, 3,025 stock, value 380,498,414.55.
- Production: 28 orders, 21 completed, 2 in progress.
- QC: 56 inspections, 28 open NCR.
- Yard: 25 active placements, 25/26 occupied slots.
- Project dashboard snapshots: 22 project rows.
- Dispatch dashboard snapshot rows: 0, while the live Logistics read model
  reports four completed dispatches.

QC and Yard endpoints explicitly returned `source=runtime` with
`fallbackReason=stale`; their operational snapshots were about 2,420 seconds
old during the REST probe.

## Root Causes

1. **Snapshot metadata coverage is incomplete.** Only Inventory and Yard are
   scheduled. The API defaults latest reads to ERP, so the repository cannot
   find an authoritative ERP row and the service raises `404`.
2. **Daily completion suppresses same-day refresh.** Metadata already records
   2026-08-11 as successful. Business events later that day do not schedule a
   replacement snapshot.
3. **Freshness is inferred from calendar date, not source watermark.**
   `payload()` marks any current business date authoritative and non-stale.
   Therefore the zero Inventory/Yard rows remain advertised as authoritative
   after live data changes.
4. **Historical reconstruction is not consistently as-of.** Inventory reads
   current `InventoryLocationStock`; Projects has no date predicate; Yard uses
   `removedAt: null` (current active placement). These generators cannot prove
   arbitrary historical state parity.
5. **Executive aggregation omits Yard and Logistics.** ERP payload aggregates
   Inventory, Components, Production, Projects, Suppliers, QC and Dispatch,
   but not the separate Yard payload.

Relevant implementation points:

- `historical-dashboard.repository.ts:75` requires an existing authoritative
  row; `historical-dashboard.service.ts:38` returns 404 when absent.
- `historical-snapshot-engine.service.ts:1003` builds Inventory from current
  location stock.
- `historical-snapshot-engine.service.ts:1128` reads all current Project
  statuses without an as-of predicate.
- `historical-snapshot-engine.service.ts:1263` counts currently active Yard
  placements.
- `historical-snapshot-engine.service.ts:1585` derives authoritative/stale only
  from whether `snapshotDate` is today.

## Projection Certification

Projection API result:

- Registered: 31.
- Healthy: 25.
- Degraded: 0.
- Active failures: 0.
- Projection documents without checkpoints: 0.
- Latest initialized lag recorded by checkpoints: roughly 15-29 seconds for
  the matching source events.

Not initialized:

- `ComponentSummary`
- `YardLoadingSummary`
- `ShipmentSummary`
- `ShipmentTimeline`
- `ProjectMaterialAllocation`
- `ProjectAcceptanceSummary`

No retry loop, active failure or duplicate snapshot was observed. Projection
coverage is **PARTIAL**, not GREEN, because six registered projections have no
checkpoint/documents.

## Browser Evidence

Playwright passed `1/1` in 31.6 seconds with no page exception and no failed
network request. Dashboard, Inventory, Production, QC, Projects, Yard,
Logistics and History all rendered and eight screenshots were retained.

This is a rendering PASS only. The History workspace correctly exposed the
runtime defect: `Snapshot mới nhất: Chưa có`, blank KPIs and
`Lỗi tải dữ liệu lịch sử`. It does not establish data parity.

## Verified

- Real authentication and all live dashboard routes respond.
- Historical read API and Jobs API are registered and protected.
- Snapshot job identity has no duplicates in current data.
- No failed/running historical jobs remain.
- Initialized projections have no active failures or orphan documents.
- All eight browser workspaces render without a React runtime crash.

## Not Verified / Failed

- Latest ERP snapshot availability.
- Production, QC, Projects, Logistics and Dispatch snapshot availability.
- Inventory and Yard live-to-snapshot parity.
- Inventory balance snapshot population.
- Monthly rollup population.
- Executive aggregation parity.
- Reliable freshness/authoritative semantics after same-day business events.
- True arbitrary-date reconstruction for current-state sources.

## Required Closure

P0:

1. Provision and schedule metadata for ERP and every required domain.
2. Define event/watermark-driven invalidation or refresh so a same-day snapshot
   cannot remain authoritative after newer source events.
3. Make `/history/dashboard/latest` return the latest valid ERP snapshot.
4. Certify exact KPI contracts between live read model, snapshot and Executive
   for every domain.
5. Replace current-state historical queries with authoritative as-of sources,
   or explicitly mark the result non-authoritative.

P1:

1. Populate and certify inventory balance and monthly rollup jobs.
2. Initialize or intentionally retire the six dormant projection definitions.
3. Align Logistics/Dispatch operational snapshot persistence with its live read
   model and include Yard in Executive aggregation where required.

## Final Decision

**NO-GO.** The live dashboards are operational, but SteelTrack cannot currently
prove `Live = Projection = Snapshot = Dashboard = Executive`. No production
source was changed in this certification sprint.

## Verification Results

- REST certification: 14 PASS / 11 FAIL (expected certification findings).
- Database certification: 4 PASS / 5 FAIL (expected certification findings).
- Playwright: 1/1 PASS, eight screenshots, 31.6 seconds.
- Backend tests: 96/96 suites, 330/330 tests PASS.
- Frontend tests: 4/4 files, 12/12 tests PASS.
- Backend build: PASS.
- Frontend build: PASS.
- Frontend typecheck: PASS.
- `git diff --check`: PASS.
