# Historical Snapshot Date Normalization Report

## Scope

SPRINT STABILITY.6 normalized Historical Snapshot business-date handling for
Prisma `@db.Date` fields. No Prisma schema, migration, Snapshot Engine
architecture, Historical Dashboard architecture, Inventory logic, Sprint C-J
workflow, staging data backfill, git staging or commit was performed.

## Root Cause

The Snapshot Engine mixed local JavaScript date mutation with Prisma `@db.Date`
storage.

During STABILITY.5 the scheduler used an Asia/Ho_Chi_Minh local-midnight
business date. The JavaScript instant was `2026-07-26T17:00:00.000Z` for the
intended calendar day `2026-07-27`. Prisma persisted the UTC date portion into
`snapshot_jobs.snapshot_date`, then the engine read the database `DATE` back as
UTC midnight and called local `setHours(0,0,0,0)`. In Asia/Ho_Chi_Minh that
shifted the generated snapshot back to `2026-07-25T17:00:00.000Z`, so
`dashboard_snapshots.snapshot_date` and `inventory_balance_snapshots.snapshot_date`
landed one business day earlier than intended.

Builds passed because the bug was a runtime calendar/serialization mismatch, not
a TypeScript or schema error.

## Canonical Date Rule

Historical Snapshot business dates now follow one rule:

```text
Business date = YYYY-MM-DD calendar date stored as UTC midnight Date
API date input = strict YYYY-MM-DD
API business date output = YYYY-MM-DD
Technical timestamps = ISO timestamp
```

Scheduler input uses the local calendar date intentionally, then converts to
UTC midnight before persistence. Prisma `@db.Date` values are normalized from
their UTC date components and are never passed through local `setHours`,
`setDate` or `setMonth`.

## Implementation

Changed files:

- `apps/backend-api/src/core/historical-snapshots/snapshot-business-date.ts`
- `apps/backend-api/src/core/historical-snapshots/snapshot-business-date.spec.ts`
- `apps/backend-api/src/core/historical-snapshots/historical-snapshot-engine.service.ts`
- `apps/backend-api/src/core/historical-snapshots/historical-snapshot-engine.service.spec.ts`
- `apps/backend-api/src/core/historical-dashboard/historical-dashboard.service.ts`
- `apps/backend-api/src/core/historical-dashboard/historical-dashboard.service.spec.ts`

Key changes:

- Added shared snapshot business-date helpers.
- Replaced local `startOfDay`, `endOfDay`, `startOfMonth` and previous-month
  calculations in the Snapshot Engine with UTC business-date helpers.
- Changed Snapshot job identity keys to use `YYYY-MM-DD`, not ISO instants.
- Changed source-watermark fallback values for business-date-only snapshots and
  rollups to `YYYY-MM-DD`.
- Ensured initial `DashboardSnapshot` creation persists `stale` from the
  generated payload.
- Changed Historical Dashboard API query parsing to strict `YYYY-MM-DD`.
- Changed API serialization for business date fields to `YYYY-MM-DD`, while
  preserving ISO timestamps for operational fields such as `createdAt` and
  `generatedAt`.

## Runtime Evidence

UTC helper check:

```json
{
  "tz": "UTC",
  "localInput": "2026-07-29T00:00:00.000Z",
  "businessDate": "2026-07-29T00:00:00.000Z",
  "formatted": "2026-07-29",
  "leap": "2024-02-29T00:00:00.000Z",
  "previousMonth": {
    "from": "2025-12-01T00:00:00.000Z",
    "to": "2025-12-31T00:00:00.000Z"
  }
}
```

Asia/Ho_Chi_Minh helper check:

```json
{
  "tz": "Asia/Ho_Chi_Minh",
  "localInput": "2026-07-28T17:00:00.000Z",
  "businessDate": "2026-07-29T00:00:00.000Z",
  "formatted": "2026-07-29",
  "leap": "2024-02-29T00:00:00.000Z",
  "previousMonth": {
    "from": "2025-12-01T00:00:00.000Z",
    "to": "2025-12-31T00:00:00.000Z"
  }
}
```

Controlled Snapshot Engine run under `TZ=Asia/Ho_Chi_Minh`:

```json
{
  "scheduled": 3,
  "processed": 3,
  "job": {
    "snapshotDate": "2026-07-29T00:00:00.000Z",
    "status": "COMPLETED",
    "metadata": {
      "identityKey": "DAILY_SNAPSHOT|YARD|ALL|stability6_dashboard_daily|2026-07-29||",
      "snapshotType": "stability6_dashboard_daily",
      "sourceWatermark": "2026-07-29"
    },
    "rowsRead": "101",
    "rowsWritten": "1",
    "errorMessage": null
  },
  "snapshot": {
    "snapshotDate": "2026-07-29T00:00:00.000Z",
    "authoritative": false,
    "stale": true,
    "rowCount": 101,
    "sourceWatermark": "2026-07-29"
  },
  "metadata": {
    "lastSuccessfulSnapshotDate": "2026-07-29T00:00:00.000Z",
    "lastSourceWatermark": "2026-07-29",
    "readinessStatus": "READY"
  }
}
```

Historical Dashboard controller/service/repository read path:

```json
{
  "dashboard": {
    "snapshotDate": "2026-07-29",
    "authoritative": false,
    "stale": true,
    "rowCount": 101,
    "sourceWatermark": "2026-07-29"
  },
  "jobs": [
    {
      "snapshotDate": "2026-07-29",
      "fromDate": null,
      "status": "COMPLETED",
      "metadata": {
        "identityKey": "DAILY_SNAPSHOT|YARD|ALL|stability6_dashboard_daily|2026-07-29||",
        "snapshotType": "stability6_dashboard_daily",
        "sourceWatermark": "2026-07-29"
      }
    }
  ]
}
```

## Verification

| Check | Result |
| --- | --- |
| Prisma validate | PASS |
| Prisma generate | PASS |
| Prisma migrate status | PASS, database schema is up to date |
| Targeted Snapshot Engine tests | PASS |
| Targeted Historical Dashboard tests | PASS |
| Snapshot business-date tests | PASS |
| Full backend tests | PASS, 76 suites / 215 tests |
| Backend build | PASS |
| Frontend build | PASS |
| `git diff --check` | PASS |

## Certification

Status: **PASS**

The STABILITY.5 Historical Snapshot date-normalization P1 is resolved. Exact
business-date persistence and Historical API reads are now certified for UTC and
Asia/Ho_Chi_Minh boundary behavior.

Remaining work is outside this sprint:

- B1 runtime integration fixture.
- Authenticated browser route harness.
- Historical Snapshot multi-worker staging QA.
