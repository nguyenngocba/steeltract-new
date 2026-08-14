# SYSTEM.PRODUCT.AUDIT.1 - Runtime Data Cleanliness

Audit date: 2026-08-14  
Database: local `steeltrack` demo/regression environment  
Mode: read-only SQL/Prisma aggregates; no DELETE/TRUNCATE/reset

## Executive finding

**Integrity is strong; cleanliness is poor.** Inventory conservation and most
physical lineage checks pass, but the current database is primarily a retained
certification fixture dataset rather than a clean UAT/demo dataset.

## Current record inventory

| Area | Records | Classification |
|---|---:|---|
| Users / Roles / Permissions | 47 / 26 / 93 | SYSTEM DATA plus many regression personas |
| Suppliers | 12 | 1 apparent business/master row, 11 fixture-like rows |
| Materials / Categories / UOM / Technical groups / Usage types | 25 / 30 / 30 / 35 / 3 | Mixed canonical master and regression master |
| Warehouses / Zones / Location stock buckets | 3 / 2 / 51 | Canonical master plus one disabled certification warehouse |
| Yard zones / slots / active placements | 1 / 27 / 26 | Mostly regression topology and placements |
| Projects / requirements | 24 / 24 | Regression fixture business data |
| Component definitions / instances | 24 / 56 | Regression fixture business data |
| Canonical BOM / legacy BOM | 24 / 24 | Regression fixture plus retained compatibility BOM |
| Production orders / executions | 30 / 29 | Regression fixture business data |
| QC inspections / NCR | 58 / 28 | 56 canonical physical fixture inspections plus 2 legacy/non-instance inspections |
| Inventory transactions / location stocks | 135 / 51 | Canonical signed fixture ledger |
| Purchase requests / purchase orders / PO receipt transactions | 13 / 13 / 39 | Regression procurement fixture |
| Legacy `PurchaseReceiving` | 0 | Empty legacy candidate |
| Return requests | 10 | Canonical Supplier Return fixtures |
| Dispatch orders / installed instances | 13 / 2 | Canonical logistics/reverse fixtures |
| Activity logs | 1,843 after browser audit | SYSTEM/fixture audit trail; audit login added two auth entries |
| Enterprise snapshots / module snapshots | 42 / 32 | Derived system data |
| Projection checkpoints/documents | 25 / 2,058 | SYSTEM DATA |
| Prisma migrations | 95 rows: 93 finished, 2 rolled back, 0 unfinished | SYSTEM DATA |

The initial ActivityLog count was 1,841. The required real login/browser audit
created two authentication audit records. No business record was created,
updated or deleted.

## Fixture classification evidence

The case-insensitive fixture scan found fixture-like records in every major
business aggregate. Representative codes include:

- `SYSTEM-E2E2-...-PRJ`
- `SYSTEM-E2E2-BROWSER-...-MAT`
- `SYSTEM-QC-CERT1-...-MAT`
- `SYSTEM-REVERSE-CERT1-...`

Counts matching certification/fixture prefixes include all 24 Projects, all
30 Production Orders, all 56 ComponentInstances, 24 canonical BOMs, 126/135
Inventory transactions, 11/13 Purchase Orders, 41 Yard placements and 13
Dispatch Orders. Prefix matching is conservative: rows can be fixtures even
when the generated physical code itself is `CPL-*`.

## Integrity checks

| Check | Result | Status |
|---|---:|---|
| Negative `InventoryItem.quantity` | 0 | GREEN |
| Negative location balance | 0 | GREEN |
| Item cache != sum location stock | 0/25 mismatches | GREEN |
| Item cache != signed transaction ledger | 0/25 mismatches | GREEN |
| ComponentInstance missing PO / requirement / project / revision | 0 / 0 / 0 / 0 | GREEN |
| ProductionOrder missing canonical BOM/revision | 0 / 0 | GREEN |
| ProductionOrder missing requirement | 6/30 | YELLOW; rework/legacy compatibility requires row-level classification |
| QC inspection missing ComponentInstance | 2/58 | YELLOW; legacy rows, not canonical physical QC |
| NCR missing instance / PO | 0 / 0 | GREEN |
| NCR with null disposition | 8/28 | YELLOW; valid only while pending decision |
| PO missing Supplier FK | 0/13 | GREEN |
| PO line missing Material/UOM/Warehouse FK | 0/13 | GREEN |
| Supplier Return missing PO/source receipt | 0/10 | GREEN |
| Component dispatch line missing ComponentInstance | 0/13 | GREEN |
| Active component Yard placement missing ComponentInstance | 0/26 | GREEN |
| Yard slot over stack limit | 0/27 | GREEN |
| Projection failure | 0 across 25 HEALTHY checkpoints | GREEN |
| Stale/non-authoritative enterprise snapshots | 2/42 | YELLOW: LOGISTICS and DISPATCH |

### Yard quantity semantic warning

All 26 active placements have `remainingQuantity=0` while slots remain
OCCUPIED and `currentStackLevel>0`. The placement service and UI primarily use
active placement/quantity for occupancy, so this was not classified as an FK
or occupancy failure. It is still a P1 semantic risk: document whether
`remainingQuantity` means unstaged dispatch quantity or physical quantity in
the slot, and enforce the invariant consistently.

### ActivityLog classification

- 255 rows with null `entityId` are all `PERMISSION_DENIED`; absence of a
  business entity is expected.
- 220 rows have null `userId`; most are fixture-created inventory, project,
  Yard and Logistics events. They are not FK orphans, but actor traceability is
  incomplete for production accountability.

## Duplicate master data

No duplicate normalized codes were found for Category, Material, MaterialType,
UOM, Warehouse or Supplier. Duplicate normalized names do exist:

- Category `demo structural steel`: 2 codes.
- Category `stability category updated`: 2 codes.
- Material type `stability type updated`: 2 codes.
- UOM `Kilogram`: 7 codes, six `STABILITY7-*` variants plus `KG`.
- UOM `Piece`: 7 codes, six `STABILITY7-*` variants plus `PCS`.

These are regression master records, not acceptable clean production/UAT
master data. Code uniqueness alone does not prevent semantic duplication.

## Data that must be retained

Do not delete without a separately approved dependency-aware plan:

- `_prisma_migrations` and schema/catalog metadata.
- Permission catalog, canonical Administrator role and required system account.
- Approved role presets and settings/configuration.
- Canonical Warehouse types, active Warehouses and master taxonomy that the
  next dataset intends to reuse.
- Projection metadata/checkpoints needed for runtime workers.
- Audit records subject to the approved retention policy.

## Data that can be cleaned before new UAT/demo data

After backup and explicit approval, a controlled service/reset operation may
remove or archive:

- `SYSTEM-*`, `STABILITY*`, `DOMAIN*`, `E2E*`, `CERT*`, `OPS*`, `DEMO*`
  business graphs in dependency order.
- Their Project, requirement, Component, production, QC, Yard, Logistics,
  Procurement, Inventory and return records.
- Fixture users/roles that are not approved role presets.
- Duplicate fixture Categories/UOM/MaterialTypes after dependency review.
- Derived snapshots/projection documents/outbox/jobs according to retention and
  rebuild policy, not by blind deletion.

## Data that must not be deleted blindly

- Canonical master rows merely because their names resemble test values.
- Inventory transactions independently of balances; they are the ledger.
- ActivityLog, outbox or snapshot rows without an approved retention boundary.
- Warehouse/Zone records while stock, transaction, reservation or reporting
  dependencies exist.
- Any fixture row in isolation from its aggregate graph.

## Data cleanliness score

**Data Integrity: 75/100**

The relational and quantity invariants are strong. The deduction reflects a
database dominated by retained certification fixtures, duplicate semantic
master names, two stale snapshots, two nonphysical QC rows and incomplete actor
attribution. This environment should not be presented as clean business data.
