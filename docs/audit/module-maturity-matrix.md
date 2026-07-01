# Module Maturity Matrix

Date: 2026-06-29

Scale:

- 0-20: Missing or placeholder.
- 21-40: Basic foundation only.
- 41-60: Partial operational coverage.
- 61-80: Strong operational foundation with gaps.
- 81-100: Mature production-ready foundation.

## Enterprise Maturity

| Area | Score | Rating | Reason |
|---|---:|---|---|
| Architecture | 72% | Strong partial | Clear modular Nest/React/Prisma architecture, but workflow/realtime/import/costing are not yet unified enterprise services. |
| Navigation | 86% | Mature | Most modules are route-backed and refresh-safe; two sidebar configs and placeholder tabs remain debt. |
| Design System | 82% | Mature partial | Shared cockpit components exist and are used by Inventory/Components/Production/Yard/Dashboard; Projects/Suppliers/QC/Logistics need rollout. |
| Inventory | 92% | Mature | Transaction-first, location-stock source of truth, attachments, numbering, adjustment, rich UI. |
| Components | 78% | Strong partial | Lifecycle/costing/readiness/UI are strong; dedicated detail route, richer workflow, and non-material costs missing. |
| Production | 76% | Strong partial | BOM/MO/reservation/issue/return/consume/ledger/cockpits exist; shopfloor and approval workflows incomplete. |
| Yard | 70% | Strong partial | Yard map, 3D, placements/movements, metrics exist; dispatch/workflow/coordinates/realtime incomplete. |
| Projects | 56% | Partial | Project components/material visibility exists; costs/documents/milestones/contracts are placeholders. |
| Suppliers | 52% | Partial | Supplier master and evaluation exist; purchasing/payables/delivery lifecycle incomplete. |
| QC | 58% | Partial | Inspection/NCR gate works; CAPA, checklist execution depth, evidence lifecycle, calibration incomplete. |
| Workflow | 45% | Partial | Workflow engine models/APIs exist, but modules are not consistently integrated. |
| Costing | 60% | Partial | Material costing foundation exists; labor/machine/overhead/project budget control missing. |
| Historical Import | 35% | Weak partial | Master import is feasible; transactional import/rebuild rules are not ready. |
| Realtime | 42% | Weak partial | WebSocket foundations exist, but operational modules mostly poll. |
| Dashboard | 68% | Strong partial | Executive read-only cockpit uses real data; action mutation, preferences, and rollup strategy missing. |

## Module Detail Matrix

| Module | DB Coverage | API Coverage | Frontend Coverage | Workflow Coverage | Overall |
|---|---:|---:|---:|---:|---:|
| Inventory | 95% | 92% | 95% | 85% | 92% |
| Components | 78% | 80% | 88% | 66% | 78% |
| Production | 85% | 82% | 82% | 62% | 76% |
| Yard | 78% | 72% | 85% | 48% | 70% |
| Projects | 55% | 58% | 70% | 42% | 56% |
| Suppliers | 50% | 55% | 66% | 38% | 52% |
| QC | 65% | 66% | 68% | 45% | 58% |
| Logistics | 20% | 25% | 45% | 10% | 25% |
| Planning | 30% | 35% | 45% | 20% | 32% |
| Admin/System | 65% | 60% | 65% | 45% | 58% |
| Dashboard | 65% | 75% | 75% | 30% | 68% |

## Priority Ranking

P0:

- Historical import blockers.
- Inventory slot-level ledger/reconciliation.
- Workflow Engine integration decisions.
- Costing source-quality validation.

P1:

- Project cost and budget control.
- Supplier/Purchasing operational lifecycle.
- QC CAPA and evidence lifecycle.
- Realtime event contract.

P2:

- Logistics backend foundation.
- Planning/scheduling depth.
- Dashboard action mutation and drill-through.
- Design system rollout to Projects/Suppliers/QC/Logistics.

P3:

- Advanced shopfloor monitoring.
- 3D coordinate enrichment.
- Dashboard personalization.
- Cross-module report builder.

