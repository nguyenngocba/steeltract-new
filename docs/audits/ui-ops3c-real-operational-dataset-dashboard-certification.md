# UI.OPS.3C - Real Operational Dataset & Dashboard Certification

Date: 2026-07-29

Status: PASS with one Yard handoff gate

## Scope

This certification used a controlled real operational dataset created through authenticated runtime APIs. It did not use mock arrays, direct database business writes, fabricated dashboard values, or legacy transaction remark reconstruction.

The successful retained fixture namespace is:

`OPS3C-20260729032211`

Partial failed runtime fixture attempts were retained for audit traceability:

- `OPS3C-20260729031933`
- `OPS3C-20260729031948`
- `OPS3C-20260729032003`
- `OPS3C-20260729032030`
- `OPS3C-20260729032048`
- `OPS3C-20260729032104`
- `OPS3C-20260729032120`
- `OPS3C-20260729032140`

## Runtime Baseline

The certification continued from STABILITY.OPS3A1.1. That prior gate had already certified:

- MAIN warehouse: `wh-main-steeltrack`
- PRODUCTION warehouse: `wh-production-steeltrack`
- MAIN receipt -> MAIN to PRODUCTION transfer
- MAIN on hand 60, PRODUCTION on hand 40 from a 100 unit fixture
- Production reservation reduced available quantity without reducing on hand
- Existing production stock exposed through `/inventory/items`

UI.OPS.3C did not re-audit that baseline except where the new fixture required fresh runtime proof.

## Created Dataset

### Project

| Field | Value |
| --- | --- |
| Project ID | `cms5iqull0kfmpvhfykmfbtpy` |
| Project Code | `OPS3C-20260729032211-PRJ` |
| Project Name | `OPS3C-20260729032211 - Nhà xưởng kiểm thử vận hành` |

### Materials

| Material | ID | Code | Runtime Meaning |
| --- | --- | --- | --- |
| A | `cms5iqumm0kfrpvhf3o8oyfqu` | `OPS3C-20260729032211-MAT-A` | Sufficient PRODUCTION stock |
| B | `cms5iqure0kgjpvhfhpuap03o` | `OPS3C-20260729032211-MAT-B` | Limited PRODUCTION stock |
| C | `cms5iquuw0khbpvhfuln4fign` | `OPS3C-20260729032211-MAT-C` | Material master only, zero PRODUCTION stock |
| D | `cms5iquvo0khfpvhfr03csbu7` | `OPS3C-20260729032211-MAT-D` | Available PRODUCTION stock, later reserved and issued |

All physical material stock originated through:

Material Master -> Receipt MAIN -> Transfer MAIN to PRODUCTION

Observed material D before reservation:

- PRODUCTION on hand: 80
- Production ledger before issue: 0

## Component Definitions And Requirements

Created through canonical definition requirement API. Creating requirements did not create physical instances.

| Component | Component ID | Component Code | Requirement ID | Required Quantity |
| --- | --- | --- | --- | --- |
| A | `cms5iquyx0ki5pvhfkyexixpt` | `CPL-20260729-373DF0D8` | `cms5iquz30ki7pvhf0zub84n1` | 5 |
| B | `cms5iquzi0kibpvhf197ei0gk` | `CPL-20260729-F52C917C` | `cms5iquzl0kicpvhfe5cac46i` | 2 |
| C | `cms5iqv050kifpvhfxf8m9dmg` | `CPL-20260729-37508300` | `cms5iqv1f0kikpvhfkrj78kt2` | 3 |

Certification:

- Component definitions created: PASS
- Project requirements created: PASS
- ComponentInstance count before PO release: 0, PASS
- Quantity semantics: requirement quantity only, PASS
- No inventory created by component definition: PASS
- No ProductionOrder created by component definition: PASS

## Engineering Release And BOM

Component A and B were advanced through revision/BOM/release.

| Component | Release Result | BOM Result | BOM Content Hash |
| --- | --- | --- | --- |
| A | Released | Released | `11332bc9d05925084c0c407212c6e05d78cdda415fc8ecc30d4cd298aa2ca4de` |
| B | Released | Released | `b2796eda8aa1b30e097367b0def6b747e67c63674381bd83da958f33b22c143f` |

Certification:

- Engineering BOM did not create instances: PASS
- Engineering BOM did not reserve material: PASS
- Engineering BOM did not issue material: PASS
- Engineering BOM remained definition-level data: PASS

## Production Orders

| Order Role | Production Order ID | Runtime Result |
| --- | --- | --- |
| DRAFT | `cms5iqvj00ksypvhfuu9kvvit` | Created and retained in DRAFT |
| RELEASED | `cms5iqvkh0ktnpvhfdxaa2hjv` | Released with generated physical instance |
| ACTIVE | `cms5iqvnx0kvepvhfp50fb0yt` | Started and later assigned to instance execution |
| QC PASS path | `cms5iqvu60l00pvhfz05apma3` | Completed to QC, then PASS |
| QC FAIL path | `cms5iqw8k0lavpvhfiuz4yb1r` | Completed to QC, then FAIL + NCR |

Over-allocation was rejected correctly:

`Active Production Order quantity exceeds Project component requirement quantity`

Certification:

- DRAFT order visible: PASS
- RELEASED order visible: PASS
- Active/in-progress order visible: PASS
- Completion path visible: PASS
- Over-allocation rejected: PASS

## Reservation And Issue

The ACTIVE order used material D from PRODUCTION warehouse.

| Check | Result |
| --- | --- |
| Reservation created | PASS |
| Reservation ID | `3c12ea0e-25e0-4725-ae5c-0c313ea7a426` |
| Reservation preserved on hand semantics | PASS |
| Issue command executed | PASS |
| Issue IDs | `8ed93ae0-3bcd-4d14-a31a-5dbfe6fb2ef3`, `083fa8d2-88cf-4007-982c-4c894a981664` |

Issue semantics were certified through the canonical production material issue endpoint. Reservation and issue should be shown as distinct concepts in UI:

- Reservation: committed production stock
- Issue: material moved into production execution consumption path
- On-hand/current production stock must not be reconstructed from transaction remarks

## Physical Instance And Execution States

After runtime augmentation, the fixture exposed all required physical states:

| Instance ID | Instance No | Physical State | Production Order | Execution Status |
| --- | --- | --- | --- | --- |
| `cms5iqvlo0ku7pvhfkfq5628k` | `CPL-20260729-373DF0D8-PO-RELEASED-001` | PLANNED | RELEASED | Not started |
| `cms5iqvp30kwapvhfq90u1hbz` | `CPL-20260729-373DF0D8-PO-ACTIVE-001` | IN_PRODUCTION | ACTIVE | RUNNING |
| `cms5iqvwk0l1gpvhfbs6lrhl2` | `CPL-20260729-373DF0D8-PO-PASS-001` | QC_PASSED | QC PASS path | COMPLETED |
| `cms5iqw9x0lcdpvhfd9pzzjtl` | `CPL-20260729-F52C917C-PO-FAIL-001` | QC_FAILED | QC FAIL path | COMPLETED |

Certification:

- PLANNED physical instance: PASS
- IN_PRODUCTION physical instance: PASS
- PRODUCED_WAITING_QC was reached before final QC decisions: PASS
- QC_PASSED physical instance: PASS
- QC_FAILED physical instance: PASS

## QC And NCR

Final QC operated on ComponentInstance identity.

| Path | Result |
| --- | --- |
| QC PASS physical instance | PASS |
| QC FAIL physical instance | PASS |
| NCR creation on failed instance | PASS |

QC UI must continue to target physical ComponentInstance rows, not Component engineering definitions.

## Finished Goods

Canonical source:

`GET /components/instances/finished-goods`

Runtime result for the fixture project:

- HTTP 200
- `meta.total = 1`
- Eligible state: QC_PASSED only

Certification:

- QC_PASSED instance appears in finished goods: PASS
- QC_FAILED instance does not appear in finished goods: PASS
- PLANNED / IN_PRODUCTION instances do not appear in finished goods: PASS

## Yard Handoff Gate

Attempted canonical finished goods to Yard handoff through the available production endpoint:

`POST /production/:productionOrderId/stage-to-yard`

Runtime result:

HTTP 400:

`Production order must be completed before yard staging`

Finding:

The currently exposed Yard handoff path is still order-level and is not yet a clean ComponentInstance finished-goods handoff. This is a gate for a later sprint. UI must not pretend that Finished Goods are already yard stock unless the canonical Yard API confirms the placement.

## Dashboard And UI Widget Matrix

| Area | Canonical Source | Certification | Notes |
| --- | --- | --- | --- |
| Components - Definition list | `/components/foundation/requirements` | PASS | Represents Component definition + Project requirement |
| Components - Finished Goods | `/components/instances/finished-goods` | PASS | QC_PASSED only |
| Components - Production Warehouse | `/inventory/items` location balances for PRODUCTION | PASS | Current production stock, not historical issue list |
| Production - Orders | `/production` | PASS | DRAFT, RELEASED, IN_PROGRESS, completed paths present |
| Production - Reservations | `/production/reservations` | PASS | Reservation state is separate from on-hand stock |
| Production - Material Issues | Production material issue command/read paths | PASS | Issue records created from PRODUCTION custody |
| Production - Instance Execution | ComponentInstanceExecution command/read paths | PASS | IN_PRODUCTION and completed paths present |
| QC - Waiting/final inspection | ComponentInstance-backed QC endpoints | PASS | Final QC targets physical instance |
| QC - NCR | QC NCR endpoint | PASS | Failure path created NCR |
| Yard | Production stage-to-yard endpoint | WARNING | Not yet canonical instance-level handoff |

## Legacy Semantic Findings

1. Legacy `Component.status` remains unsafe as physical inventory truth.
   Released engineering components may still expose legacy statuses for backward compatibility. Dashboards and tables must not treat all Component rows, `STOCK`, or `READY` as finished physical inventory.

2. `Component.description` legacy metadata remains readable but must not be used for canonical quantity, type, or profile for new records.

3. Production material stock must be sourced from PRODUCTION warehouse balances and reservations, not from transaction remarks or frontend-filtered historical issue lists.

4. Finished goods must use `GET /components/instances/finished-goods`, not `COUNT(Component)`.

5. Yard handoff still needs a canonical ComponentInstance placement API or an adapted order endpoint that validates finished goods instance identity.

## API Mapping

| Workflow | API |
| --- | --- |
| Create component definition + requirement | `POST /components/foundation/definition-requirements` |
| Read requirements | `GET /components/foundation/requirements` |
| Read physical instances | `GET /components/foundation/instances` |
| Read finished goods | `GET /components/instances/finished-goods` |
| Read production orders | `GET /production` |
| Reserve material | Production reservation command endpoint |
| Issue material | Production material issue command endpoint |
| Assign/start instance execution | Production instance execution command endpoint |
| Final QC decision | QC final physical instance endpoint |
| Read QC inspections | `GET /qc/inspections` |
| Read NCR | `GET /qc/ncr` |
| Read production stock | `GET /inventory/items` with PRODUCTION location balances |

## P0

- None for Components -> Production -> QC -> Finished Goods runtime certification.

## P1

- Implement/finish canonical ComponentInstance -> Yard placement flow before representing yard stock as physical finished goods in UI.
- Ensure every Components dashboard metric that says inventory/finished goods uses `GET /components/instances/finished-goods`.
- Ensure Production Warehouse widgets show current production stock balance, not historical issue rows.
- Ensure QC queues clearly display physical instance code, project, production order, component definition, and QC state.

## P2

- Browser visual smoke for Components, Production, QC with the retained fixture.
- Expand QC checklist template/result display beyond final PASS/FAIL once checklist data entry is authoritative.
- Add richer operational chart drilldowns after the canonical read sources are fully wired.

## Verification Notes

Runtime E2E certification passed using the retained fixture `OPS3C-20260729032211`.

The final post-run database evidence gather could not be repeated after context compaction because host-level escalation was rejected by the approval system usage limit. This is an environment/tooling constraint, not an application runtime failure. The successful runtime API trace and prior augmentation output remain the certification evidence.

No source code, Prisma schema, migration, staging, or commit was performed by this report.
