# STABILITY.OPS3A1.1 - Runtime Production Warehouse Certification

Date: 2026-07-29

Status: **PASS - RUNTIME CERTIFIED**

Mode: runtime certification only. No application source code, schema or
migration changes were made.

## Runtime Environment

Healthy backend used for certification:

- base URL: `http://127.0.0.1:3000`
- `/health/live`: `200 OK`, `{"status":"live"}`
- `/health/ready`: `200 OK`, `{"status":"ready","checks":{"database":"up"}}`
- host process observation: `node dist/main` listening on `0.0.0.0:3000`
- PostgreSQL observation: `postgres` listening on `0.0.0.0:5432`

The earlier failure was caused by sandbox/runtime isolation. A sandbox-started
Nest process could not reach `localhost:5432`, but the already-running host
backend is healthy and database-ready.

`/proc/<pid>/environ` was not read because it can expose runtime secrets. This
does not block certification because `/health/ready` proves the running backend
can reach its configured database.

## DB Connectivity

Runtime HTTP readiness certified database connectivity:

```json
{
  "status": "ready",
  "checks": {
    "database": "up"
  }
}
```

Direct database access during this sprint was SELECT-only for verification.
No direct Prisma/SQL business writes were used.

## Fixture

Controlled namespace:

```text
OPS3A1-RT-20260729030324
```

Business records were created through authenticated HTTP APIs only.

Fixture identity:

| Field | Value |
| --- | --- |
| Material ID | `cms5i2oka01v6pvhf84zbx9x9` |
| Material Code | `OPS3A1-RT-20260729030324` |
| Zero Production Material ID | `cms5i2okx01v8pvhfcu5w8luo` |
| Zero Production Material Code | `OPS3A1-RT-20260729030324-ZERO` |
| MAIN Warehouse | `wh-main-steeltrack`, `MAIN`, `Kho chính` |
| PRODUCTION Warehouse | `wh-production-steeltrack`, `PRODUCTION`, `Kho sản xuất` |
| MAIN Zone | `cmpsayrcf0000pv44n1kwk5bn`, `A01`, `Kho chính A01` |
| PRODUCTION Zone | `cmq0o6wg60001pvr68zzzx1fx`, `C01`, `Kho sản xuất C01` |
| MAIN Slot | `OPS3A1-RT-20260729030324-MAIN-SLOT` |
| PRODUCTION Slot | `OPS3A1-RT-20260729030324-PROD-SLOT` |

Existing zones were reused. No certification zones were created.

Note: two earlier certification script attempts created partial
`OPS3A1-RT-*` fixtures through HTTP APIs before the final successful run:

- `OPS3A1-RT-20260729030209`
- `OPS3A1-RT-20260729030248`

They were intentionally not removed by direct database writes. The certified
fixture for acceptance is `OPS3A1-RT-20260729030324`.

## Receipt

Created through:

```text
POST /inventory/items
POST /inventory/transactions
```

Receipt:

| Field | Value |
| --- | --- |
| Transaction ID | `cms5i2ols01vapvhf37dpqt4y` |
| Code | `NK-260729-00003` |
| Transaction No | `NK-260729-00003` |
| Quantity | `100` |

After receipt:

| Warehouse | Quantity |
| --- | ---: |
| MAIN | 100 |
| PRODUCTION | 0 |

Result: **PASS**

## Transfer

Created through:

```text
POST /inventory/transactions
```

Transfer:

| Field | Value |
| --- | --- |
| Transaction ID | `cms5i2oni01vhpvhfsmcpqtcd` |
| Code | `DC-260729-00002` |
| Transaction No | `DC-260729-00002` |
| Quantity | `40` |

After transfer:

| Warehouse | Expected | Actual |
| --- | ---: | ---: |
| MAIN | 60 | 60 |
| PRODUCTION | 40 | 40 |
| TOTAL | 100 | 100 |

Result: **PASS**

## Quantity Reconciliation

Canonical reconciliation:

```text
Receipt 100
Transfer 40

MAIN       = 60
PRODUCTION = 40
TOTAL      = 100
```

Global physical quantity was conserved.

Result: **PASS**

## Inventory Items API

Certified:

```text
GET /inventory/items
```

Controlled material returned `locationBalances`:

| Warehouse | Zone | Slot | Level | Quantity |
| --- | --- | --- | --- | ---: |
| MAIN | `A01` | `OPS3A1-RT-20260729030324-MAIN-SLOT` | `L1` | 60 |
| PRODUCTION | `C01` | `OPS3A1-RT-20260729030324-PROD-SLOT` | `L1` | 40 |

This directly certifies the UI.OPS.3A.1 root-cause fix.

Result: **PASS**

## Production Warehouse

The Components **Kho vật tư sản xuất** path uses the same
`/inventory/items.locationBalances` source filtered to `warehouseCode =
PRODUCTION`.

For the controlled material before reservation:

| Metric | Value |
| --- | ---: |
| Tồn SX | 40 |
| Đã giữ | 0 |
| Khả dụng | 40 |
| Kho chính, informational only | 60 |

No transaction remark reconstruction was used.

Result: **PASS**

## Reservation

Created through:

```text
POST /production/boms
POST /production
POST /production/:id/release
POST /production/:id/reservations
```

Reservation fixture:

| Field | Value |
| --- | --- |
| BOM ID | `09bd63f5-e8bd-49fa-a1b1-bd8f3b79e34c` |
| Production Order ID | `cms5i2otx01vqpvhf6o3p5ybm` |
| Reservation ID | `2b4bbf5a-dad1-42bf-baca-0965d916c0e8` |
| Demand | 20 |
| Status | `RESERVED` |

Reservation line:

| Warehouse | Zone | Slot | Required | Reserved | Issued | Returned |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| PRODUCTION | `C01` | `OPS3A1-RT-20260729030324-PROD-SLOT` | 20 | 20 | 0 | 0 |

Certified semantics:

| Metric | Before | After |
| --- | ---: | ---: |
| onHand(PRODUCTION) | 40 | 40 |
| active reserved | 0 | 20 |
| available | 40 | 20 |

Result: **PASS**

## BOM Availability

The same material is visible through the BOM picker source:

- Material Master identity: `OPS3A1-RT-20260729030324`
- MAIN stock: 60, informational only
- PRODUCTION stock: 40
- reserved before reservation: 0
- available before reservation: 40
- PRODUCTION location: `C01 / OPS3A1-RT-20260729030324-PROD-SLOT / L1`

Zero-production-stock selector certification:

| Field | Value |
| --- | --- |
| Material Code | `OPS3A1-RT-20260729030324-ZERO` |
| PRODUCTION stock | 0 |
| Selectable by BOM picker source | true |

Engineering BOM authoring is not blocked by zero Production stock.

Result: **PASS**

## Production Readiness

Endpoint:

```text
GET /production/:id/requirements
```

Before reservation:

| Required | On Hand SX | Reserved | Available SX | Reservable | Issued | Shortage |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 20 | 40 | 0 | 40 | 20 | 0 | 0 |

After reservation:

| Required | On Hand SX | Reserved | Available SX | Reservable | Issued | Shortage |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 20 | 40 | 20 | 20 | 20 | 0 | 0 |

Reconciliation:

```text
Components Kho vật tư sản xuất availability = 40 before reservation
BOM assistant production availability       = 40 before reservation
Production readiness availability           = 40 before reservation

After reservation:
Production readiness availability = 20
```

There was no hidden MAIN contribution.

Result: **PASS**

## Existing Stock Findings

SELECT-only audit for existing `PRODUCTION` warehouse stock:

| Metric | Value |
| --- | ---: |
| Production warehouse ID | `wh-production-steeltrack` |
| Materials with current PRODUCTION stock | 9 |
| Current PRODUCTION location balances | 11 |
| Current PRODUCTION total quantity | 4216.9 |
| `/inventory/items` PRODUCTION location balances | 11 |
| `/inventory/items` PRODUCTION total quantity | 4216.9 |

Historical/current reconciliation check:

| Metric | Value |
| --- | ---: |
| Materials with PRODUCTION transaction-line net | 9 |
| Materials with current PRODUCTION stock | 9 |
| Positive transaction net with no current stock | 0 |
| Current stock with no transaction net | 0 |
| PRODUCTION transaction net quantity | 4216.9 |
| PRODUCTION current stock quantity | 4216.9 |

No historical reconciliation debt was found in this runtime dataset.

## Browser Smoke

Browser smoke: **NOT TESTED**

Authenticated HTTP certification succeeded. The sprint accepts browser smoke as
not tested when authenticated HTTP certification succeeds.

## Defects Fixed

No code defects were fixed in this certification sprint.

The only runtime issue found was the previous environment mistake: starting a
new Nest process inside the isolated sandbox could not reach the host
PostgreSQL service. The already-running host backend on port 3000 is healthy.

## Verification

Passed:

- host process discovery: backend on `0.0.0.0:3000`
- host port discovery: PostgreSQL on `0.0.0.0:5432`
- `GET /health/live`
- `GET /health/ready`
- `POST /auth/login`
- controlled Material Master create through API
- controlled MAIN receipt through API
- controlled MAIN -> PRODUCTION transfer through API
- controlled Production BOM create through API
- controlled Production Order create/release through API
- controlled Production Reservation through API
- `/inventory/items` certification
- Components Production Warehouse source certification
- BOM picker source certification
- Production readiness certification
- existing PRODUCTION stock SELECT-only reconciliation

## Final Status

Acceptance:

| Gate | Status |
| --- | --- |
| Receipt MAIN | PASS |
| Transfer MAIN -> PRODUCTION | PASS |
| Quantity conservation | PASS |
| `/inventory/items.locationBalances` | PASS |
| Components Production Warehouse source | PASS |
| BOM production availability | PASS |
| MAIN isolation | PASS |
| Reservation semantics | PASS |
| Production readiness | PASS |
| No direct DB business writes | PASS |
| Browser smoke | NOT TESTED |

Final certification: **PASS**
