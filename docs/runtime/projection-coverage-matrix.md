# Projection Coverage Matrix

Date: 2026-07-17  
Scope: RFC002A canonical payload completion

| Projection | Events | Required facts | Remaining gap | Certification |
| --- | --- | --- | --- | --- |
| ProductionOrderSummary | `production.order.*` | order identity, resulting state, engineering basis, quantity, unit, lifecycle time | No canonical rows in retained test Outbox | AUTHORITATIVE for new events |
| WorkOrderSummary | `production.work-order.*` | parent/order/work-order identity, routing, sequence, quantity, state, lifecycle time | No canonical rows in retained test Outbox | AUTHORITATIVE for new events |
| ProductionTimeline | all canonical Production families | envelope identity, ordering, occurrence time, typed payload | Execution publisher absent | NON-AUTHORITATIVE for complete Production history |
| ProductionExecution | `production.execution.*` | execution run, work order, work center/machine, state, timestamps | No publisher exists | NON-AUTHORITATIVE |
| ProductionDashboard | `production.order.*` | same facts as order summary | Projection is per-order, not a portfolio KPI reducer | AUTHORITATIVE for order facts |
| OperatorWorkQueue | `production.work-order.*` | work order state, routing, sequence, quantity | No historical canonical rows in current DB | AUTHORITATIVE for new events |
| ComponentSummary | component identity lifecycle | code/name/description/project/resulting state/current revision | Historical canonical rows absent | AUTHORITATIVE for new events |
| CurrentReleasedRevision | `component.revision.released` | component/revision/BOM/hash/previous revision/resulting state | Historical canonical rows absent | AUTHORITATIVE for new events |
| RevisionHistory | `component.revision.*` | revision identity/state/base/BOM/hash/reason | Historical canonical rows absent | AUTHORITATIVE for new events |
| EngineeringBOMView | `component.bom.definition.*` | component/revision/BOM/hash/state/changed sections | Historical canonical rows absent | AUTHORITATIVE for new events |
| ReleaseTimeline | released/superseded | component/revision/BOM/hash/previous/current state | Historical canonical rows absent | AUTHORITATIVE for new events |
| MaterialAvailability | canonical Inventory stock facts plus compatibility events | material, delta, unit, resulting total stock, location, posting time | Legacy retained events omit quantity/unit/resulting stock; locationless legacy writes cannot emit complete facts | NON-AUTHORITATIVE |
| ReservationProjection | production reserved/released | reservation/material/order, quantity/unit/resulting balance/state | No retained canonical material events | AUTHORITATIVE for new reserve/release events |
| LocationBalance | Inventory stock facts | one document per material/location bucket with resulting location balance | Current projection key is material, not full location bucket; engine changes are out of scope | NON-AUTHORITATIVE |
| StockMovementSummary | Inventory movement events | transaction/material/delta/unit/location/posting facts | Historical compatibility events are incomplete | NON-AUTHORITATIVE for full history |
| ProductionMaterialStatus | `production.material.*` | material flow identity, quantity/unit/resulting balance/state | Some issue paths do not expose a cumulative resulting Production balance | NON-AUTHORITATIVE |
| ProductionVsInventory | Production material + Inventory stock | complete facts and correlation identifiers on both sides | Historical Inventory side incomplete | NON-AUTHORITATIVE |
| ComponentUsage | `production.order.*` | order/component/revision/BOM/resulting state | No retained canonical rows | AUTHORITATIVE for new events |
| OpenReservations | reserved/released | reservation/material/open state/resulting reserved balance | Issue fulfillment does not emit release and is not consumed by this projection | NON-AUTHORITATIVE |
| ReleasedComponentCatalog | revision released + component lifecycle | component/revision/BOM/hash and eligibility lifecycle | Historical canonical rows absent | AUTHORITATIVE for new events |

`AUTHORITATIVE for new events` means the producer now emits sufficient source
facts without aggregate reads. It does not claim that missing historical facts
were backfilled.
