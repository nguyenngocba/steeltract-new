# STABILITY.DOMAIN5G.1 - Runtime Database Connectivity & E2E Certification

Date: 2026-07-28

## Final Status

Updated by STABILITY.DOMAIN5G.2:

- Backend/runtime API E2E is now **GREEN**.
- Overall DOMAIN.5G remains **YELLOW** only because authenticated browser smoke is still not tested.

The REST blocker identified below was resolved by exposing existing `ProductionExecution` lifecycle commands under `/production/commands/executions/...`. See `docs/audits/component-domain5g2-production-execution-rest-report.md`.

Previous DOMAIN5G.1 status:

DOMAIN.5G was **YELLOW / CONDITIONALLY CERTIFIED**.

The original runtime blocker is resolved: the active Nest runtime can connect to PostgreSQL and `/health/ready` reports database up. The remaining blocker is no longer database connectivity. The authenticated runtime smoke is blocked later by an API surface gap: `ProductionExecution` can be created by `POST /production/commands/orders/:id/start`, but there is no exposed HTTP command endpoint to complete that `ProductionExecution`. Because WorkOrder completion correctly rejects active executions, the physical instance cannot advance through all mandatory operations to `PRODUCED_WAITING_QC` via HTTP-only canonical APIs.

## Database Identity

Sanitized intended target:

| Property | Value |
| --- | --- |
| Provider | PostgreSQL |
| Host | localhost |
| Port | 5432 |
| Database | steeltrack |
| Schema | public |

Prisma Client read evidence:

```json
{
  "rows": [
    {
      "database": "steeltrack",
      "schema": "public",
      "port": 5432,
      "ok": 1
    }
  ],
  "componentCount": 10
}
```

## PostgreSQL Availability

PostgreSQL is available from the approved host runtime path.

Sandbox-local Prisma reads failed with `PrismaClientInitializationError: Can't reach database server at localhost:5432`. The execution environment uses network isolation, so sandbox-denied localhost access is classified as tool/runtime isolation, not database downtime.

`prisma migrate status` reports:

```text
Datasource "db": PostgreSQL database "steeltrack", schema "public" at "localhost:5432"
84 migrations found in prisma/migrations
Database schema is up to date!
```

## Runtime Environment

An existing backend process on port 3000 is healthy and exposes the canonical DOMAIN.5 routes. A second backend start attempt reached Nest route mapping but failed with `EADDRINUSE`, confirming the active backend already occupied the port. The existing healthy process was reused and was not killed.

Health checks:

```json
GET /health/live  -> 200 {"status":"live"}
GET /health/ready -> 200 {"status":"ready","checks":{"database":"up"}}
```

## Root Cause

Primary root cause: **E. sandbox/runtime isolation**.

Evidence:

- Host-approved Prisma Client can read `steeltrack.public` on port 5432.
- Existing Nest runtime reports `/health/ready` with `database: up`.
- Sandbox-local database reads fail before reaching PostgreSQL.
- No source-code, schema, migration, or DATABASE_URL change was required.

Secondary condition: an existing process already occupied port 3000, so launching another backend from the certification shell produced a port conflict. Reusing the healthy runtime was the safe path.

## Remediation

No code remediation was applied.

Safe operational remediation used:

- Reused existing healthy backend on `127.0.0.1:3000`.
- Ran database connectivity and smoke calls through the approved host runtime path.
- Preserved `.env`, schema, migrations, component logic, production logic, QC logic, finished-goods logic, inventory, and yard unchanged.

## Prisma Connectivity

PASS.

- `prisma validate`: PASS.
- `prisma migrate status`: PASS, database up to date.
- Host-runtime Prisma Client `SELECT current_database(), current_schema(), inet_server_port()` returned `steeltrack/public/5432`.

## DOMAIN5G Fixture

Runtime fixture: `DOMAIN5G1-1785224939815`.

Created through authenticated/canonical APIs:

- Project: `DOMAIN5G1-1785224939815-PRJ`
- Component Definition: `CPL-20260728-A87A262D`
- ProjectComponentRequirement: `PCR-20260728-A87A262D`, required quantity `5`
- Revision: `R1`, released
- Engineering BOM: released with 1 BOM line and 2 routing operations
- Production Order: `DOMAIN5G1-1785224939815-PO`, quantity `2`

## Authenticated API Smoke

PASS until ProductionExecution close boundary.

Successful HTTP steps:

- `POST /projects` -> 201
- `POST /components/foundation/definition-requirements` -> 201
- `POST /components/commands/:componentId/revisions` -> 201
- `POST /components/commands/:componentId/revisions/:revisionId/bom/replace` -> 201
- `POST /components/commands/:componentId/revisions/:revisionId/bom/validate` -> 201
- `POST /components/commands/:componentId/revisions/:revisionId/submit-review` -> 201
- `POST /components/commands/:componentId/revisions/:revisionId/approve` -> 201
- `POST /components/commands/:componentId/revisions/:revisionId/release` -> 201
- `POST /production/commands/orders` -> 201
- `POST /production/commands/orders/:id/release` -> 201
- `POST /production/commands/orders/:id/ready` -> 201
- `POST /production/commands/orders/:id/start` -> 201
- `POST /production/commands/instance-executions/assign` -> 201
- `POST /production/commands/instance-executions/:id/start` -> 201
- `POST /production/commands/instance-executions/:id/complete` -> 201

Blocked HTTP step:

```json
{
  "method": "POST",
  "path": "/production/commands/work-orders/200374ab-d11d-4804-9fff-248bb454dd82/complete",
  "status": 400,
  "response": {
    "message": "Work Order has an active execution run",
    "error": "Bad Request",
    "statusCode": 400
  }
}
```

This rejection is correct domain behavior. The missing path is a REST command for completing the active `ProductionExecution`.

## Requirement Accounting

| Metric | Value |
| --- | ---: |
| Requirement required quantity | 5 |
| Allocated PO quantity | 2 |
| Remaining requirement quantity | 3 |
| Component rows created for fixture | 1 |
| ComponentInstance rows created by PO release | 2 |
| ProductionOrder rows created | 1 |

## Instance Accounting

Production Order `DOMAIN5G1-1785224939815-PO`:

| Instance | State |
| --- | --- |
| `CPL-20260728-A87A262D-DOMAIN5G1-1785224939815-PO-001` | `IN_PRODUCTION` |
| `CPL-20260728-A87A262D-DOMAIN5G1-1785224939815-PO-002` | `PLANNED` |

Work Orders:

| Sequence | State |
| ---: | --- |
| 1 | `IN_PROGRESS` |
| 2 | `PLANNED` |

Production Executions:

| Execution | State |
| --- | --- |
| `589f6ff1-872b-4811-877b-07faffffbae4` | `RUNNING` |

## QC Accounting

QC handoff was **NOT REACHED** through HTTP-only canonical APIs.

Reason:

- ComponentInstanceExecution completion records the instance operation as completed.
- The parent `ProductionExecution` remains `RUNNING`.
- WorkOrder completion is blocked while an active execution exists.
- Since not all mandatory WorkOrders are completed, the instance remains `IN_PRODUCTION`, not `PRODUCED_WAITING_QC`.

Waiting QC API evidence:

- `GET /components/foundation/instances?state=PRODUCED_WAITING_QC&productionOrderId=<fixture>&limit=50` -> 200, total `0`.

## Finished Goods Reconciliation

Finished Goods API evidence:

- `GET /components/instances/finished-goods?productionOrderId=<fixture>&limit=50` -> 200, total `0`.

This is correct for the current runtime state: the instance has not passed QC.

## Side Effects

For the DOMAIN5G.1 fixture:

- InventoryTransaction delta from QC PASS: `0` because QC PASS was not reached.
- YardItemPlacement delta: `0`.
- No Finished Goods entity was fabricated.
- No direct DB mutation was used to force success.

## Browser Smoke

NOT TESTED.

Reason: API smoke did not reach the canonical QC / Finished Goods state. Browser certification would be misleading until the HTTP command gap is resolved. No browser result was fabricated from API output.

## Verification

| Check | Result |
| --- | --- |
| `pnpm -C apps/backend-api exec prisma validate` | PASS |
| `pnpm -C apps/backend-api exec prisma migrate status` | PASS |
| Runtime health live | PASS |
| Runtime health ready | PASS |
| Authenticated API smoke | PARTIAL |
| Browser smoke | NOT TESTED |
| `git diff --check` | PASS |

No backend/frontend source was changed, so targeted tests and builds were not rerun for this stability report.

## Remaining P0

1. Expose canonical authenticated REST command endpoints for `ProductionExecution` transitions:
   - start if needed as an explicit command
   - pause
   - resume
   - complete
   - abort

   The service methods already exist in `ProductionCommandService`; the HTTP command surface is incomplete.

2. Rerun DOMAIN.5G smoke after `ProductionExecution` completion is available over canonical API:
   - complete WorkOrder 1
   - start/complete WorkOrder 2
   - verify instance becomes `PRODUCED_WAITING_QC`
   - QC PASS / FAIL / NCR / disposition
   - verify Finished Goods eligibility by physical identity

## Remaining P1

1. Browser smoke for:
   - `/components/list`
   - `/components/stock`
   - Production main/detail screens
   - `/qc/final`

2. Add a repeatable automated E2E harness for DOMAIN5G runtime certification, using API calls only and read-only DB reconciliation.

## Recommendation

Proceed with a narrowly scoped stability sprint to expose missing `ProductionExecution` HTTP transition commands. Do not change schema or domain rules. Once the API surface matches the already implemented service layer, rerun DOMAIN5G.1 smoke and browser certification.
