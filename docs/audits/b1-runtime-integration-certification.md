# STABILITY.7 - B1 Runtime Integration Certification

Date: 2026-07-27

Status: PASS

Scope: certify the runtime path from controlled Component fixture creation to
Production Order BOM binding. This certification did not implement Sprint C-J,
did not modify schema, did not create a migration, and did not use existing
business records as test fixtures.

## Fixture

Namespace: `STABILITY7-1785129145020`

The controlled fixture was retained for audit traceability. It uses dedicated
Component, Revision, Engineering BOM, material master rows, Production BOM and
Production Order records identified by the namespace above.

Cleanup: retained intentionally. No broad delete was attempted because the
certification requirement prefers safe retention when cleanup cannot be
guaranteed without risking business data.

## Runtime Flow

| Step | Result | Evidence |
| --- | --- | --- |
| Component Draft | PASS | Component `cms2rsvvg0007pv64r7rp6u5h`, code `STABILITY7-1785129145020-COMP`, initial lifecycle `DRAFT` |
| Sprint A gate | PASS | Production create before release rejected with `Component must be released by Engineering before Production Order creation` |
| Revision R1 | PASS | Revision `cms2rsvws000dpv64tal1op3r`, revisionNo `R1` |
| Engineering BOM replace | PASS | BOM definition `cms2rsvwv000fpv64gvlnb6rw`, 2 lines, 2 routing steps |
| Invalid BOM rejection | PASS | Negative quantity BOM input rejected before valid BOM write |
| BOM validation | PASS | BOM definition reached `VALIDATED` |
| Review/Approval/Release | PASS | Revision moved `IN_REVIEW` -> `APPROVED` -> `RELEASED`; Component became `ACTIVE` |
| Production Order create | PASS | Production Order `cms2rsw42001apv64su0g0imh`, orderNo `STABILITY7-1785129145020-PO-R1`, status `DRAFT` |
| Production BOM materialization | PASS | BOM `a1e609a9-b367-440d-8b9b-26ee3ef03676`, source `ENGINEERING` |
| Production Order BOM binding | PASS | Order binds `componentId`, `componentRevisionId`, `bomDefinitionId`, `bomId` |

## BOM Lineage

| Field | Expected | Actual |
| --- | --- | --- |
| `BOM.source` | `ENGINEERING` | `ENGINEERING` |
| `BOM.componentId` | `cms2rsvvg0007pv64r7rp6u5h` | `cms2rsvvg0007pv64r7rp6u5h` |
| `BOM.componentRevisionId` | `cms2rsvws000dpv64tal1op3r` | `cms2rsvws000dpv64tal1op3r` |
| `BOM.bomDefinitionId` | `cms2rsvwv000fpv64gvlnb6rw` | `cms2rsvwv000fpv64gvlnb6rw` |
| `BOM.engineeringContentHash` | `74b30d3c5379969ccf6760b5a42051f9e8f99dbf25aecdb04fbef9c928f115f4` | `74b30d3c5379969ccf6760b5a42051f9e8f99dbf25aecdb04fbef9c928f115f4` |
| `BOM.materializedAt` | Present | `2026-07-27T05:12:25.467Z` |

## BOM Items

| Material | Quantity | UOM | Waste % | Category | Result |
| --- | ---: | --- | ---: | --- | --- |
| `STABILITY7-1785129145020-MAT-A` | 12.5 | `kg` via `InventoryItem.unit` | 2.5 | `MAIN_MATERIAL` | PASS |
| `STABILITY7-1785129145020-MAT-B` | 3.25 | `pcs` via `InventoryItem.unit` | 7.75 | `CONSUMABLE` | PASS |

Note: `BOMItem` stores quantity, waste percent, category and material identity.
Per-line UOM is certified through the bound `InventoryItem.unit`, because the
current `BOMItem` schema has no dedicated `uom` column.

## Idempotency

The materialization path was executed again for the released Component.

| Check | Result |
| --- | --- |
| Replay returned same Production BOM id | PASS, `a1e609a9-b367-440d-8b9b-26ee3ef03676` |
| BOM count for R1 Engineering BOM definition | PASS, `1` |
| BOM item count after replay | PASS, `2` |

No duplicate Production BOM or BOMItem rows were created.

## Historical Binding

A second revision `R2` was created and released for the same fixture Component.
The Component current revision moved to R2, while the existing Production Order
remained bound to the original R1 lineage.

| Field | After R2 Release |
| --- | --- |
| Component current revision | `cms2rsw5q001ipv64pep1ikak` |
| Existing PO component revision | `cms2rsvws000dpv64tal1op3r` |
| Existing PO BOM definition | `cms2rsvwv000fpv64gvlnb6rw` |
| Existing PO Production BOM | `a1e609a9-b367-440d-8b9b-26ee3ef03676` |

Result: PASS. Historical Production Orders do not drift when a newer Component
revision is released.

## Events, Timeline and Logs

The fixture emitted component canonical events and audit activity events through
the existing Outbox. Evidence included:

- `component.created`
- `component.revision.created`
- `component.bom.definition.updated`
- `component.bom.definition.validated`
- `component.revision.review.submitted`
- `component.revision.approved`
- `component.revision.released`
- `component.revision.superseded`
- `audit.activity.created`

Component timeline entries: `16`

Production log entries for the created order: `1`

## Legacy Isolation

Baseline at fixture start:

| Table | Count |
| --- | ---: |
| Components | 7 |
| Component revisions | 6 |
| Engineering BOM definitions | 6 |
| Production BOMs | 3 |
| Production Orders | 3 |

Fixture-created records:

| Table | Count |
| --- | ---: |
| Components | 1 |
| Component revisions | 2 |
| Engineering BOM definitions | 2 |
| Production BOMs | 1 |
| Production Orders | 1 |

No pre-existing business Component, revision, Engineering BOM, Production BOM or
Production Order was used as a fixture.

## Regression Classification

| Area | Result |
| --- | --- |
| Components regression | PASS |
| Production regression | PASS |
| Inventory regression | PASS, Inventory used only for dedicated material fixture rows and material identity verification |
| Schema/migration regression | PASS, no schema or migration change |

## Certification Decision

PASS

Remaining P0: none.

Remaining P1: authenticated browser smoke certification remains outside this B1
runtime integration gate.
