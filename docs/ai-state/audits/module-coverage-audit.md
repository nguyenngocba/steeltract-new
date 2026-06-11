# Module Coverage Audit

Audit date: 2026-06-11

Scope:

- Inventory
- Production
- QC
- Yard
- Suppliers
- Projects
- Dashboard
- Components
- Organizations
- System

Method:

- Read `CURRENT_STATE.md`, `PROJECT_STATUS.md`, and `NEXT_TASKS.md`.
- Used Semble first for module discovery.
- Checked active Prisma models, backend controllers, frontend pages/routes, and ai-state module docs.

Coverage definitions:

- Database coverage: persistence models needed for current operational scope.
- Backend API coverage: read/write endpoints and workflow actions exposed by backend.
- Frontend page coverage: active routed pages and cockpit/workspace UI.
- Workflow coverage: end-to-end business flow completeness, including validation, mutation, auditability, and downstream handoff.

Percentages are pragmatic audit estimates, not product-completion guarantees.

## Summary Matrix

| Module | DB | API | Frontend | Workflow | Priority |
| --- | ---: | ---: | ---: | ---: | --- |
| Inventory | 90% | 88% | 92% | 78% | P1 |
| Production | 82% | 84% | 78% | 70% | P1 |
| QC | 72% | 78% | 72% | 58% | P1 |
| Yard | 76% | 80% | 76% | 60% | P1 |
| Suppliers | 55% | 68% | 70% | 45% | P1 |
| Projects | 42% | 35% | 62% | 30% | P2 |
| Dashboard | 25% | 55% | 72% | 38% | P2 |
| Components | 78% | 72% | 86% | 68% | P2 |
| Organizations | 0% | 0% | 0% | 0% | P3 |
| System | 70% | 58% | 72% | 42% | P1 |

## Priority Ranking

### P0

No module currently requires a P0 documentation or implementation emergency based on this audit.

### P1

- Inventory: slot-level ledger/reconciliation and backend document numbering are still structural gaps despite strong coverage.
- Production: formal BOM reservation, manual material issue/return workflow, and production-material ledger are key operational gaps.
- QC: checklist result matrix, NCR lifecycle, evidence, calibration, and release certificates are required for quality workflow maturity.
- Yard: formal outbound/shipment documents and staging workflow are required before Yard can be treated as complete.
- Suppliers: supplier-material mapping and procurement linkage are needed before Purchasing should expand.
- System: mutation APIs for users, roles, notifications, settings, audit export, and backup jobs are missing.

### P2

- Projects: contract/milestone/budget/schedule/document foundations are incomplete.
- Dashboard: preferences, drill-through, and action mutations are missing.
- Components: strong UI and model coverage, but costing/traceability and formal workflow documents still need hardening.

### P3

- Organizations: not started; build only after higher-priority operational foundations stabilize.

## Inventory

Coverage:

- Database: 90%
- Backend API: 88%
- Frontend page: 92%
- Workflow: 78%

Evidence:

- Models: `InventoryItem`, `InventoryTransaction`, `InventoryTransactionItem`, `InventoryLocationStock`, `ReturnRequest`, `ReturnRequestItem`, inventory master data models, `WarehouseZone`, `MasterWarehouse`.
- APIs: item CRUD/detail/audit, transactions, categories, units, material types, zones, return workflow.
- Pages/routes: Inventory overview, materials, material detail, locations, inbound, outbound, transfer, stock take, adjustments, alerts, master data, audit.

Missing tables:

- Immutable slot-level ledger table that can rebuild `inventory_location_stocks`.
- Reservation/allocation ledger.
- Backend document sequence table for deterministic inventory document numbers.
- Lot/batch/cost layer tables if batch costing becomes in scope.

Missing APIs:

- Backend deterministic document number generation.
- Formal slot-balance reconciliation endpoint.
- Reservation document APIs.
- Bulk import/export and audit export endpoints.
- Full stock count session lifecycle APIs beyond current transaction support.

Missing pages:

- Full warehouse 2D workspace beyond embedded read/select maps.
- Reconciliation and variance review page.
- Reservation management page.

Missing workflows:

- Persisted slot-level reconciliation from transaction history.
- Formal reservation/allocation lifecycle.
- Backend-owned numbering.
- End-to-end stock count approval workflow.

## Production

Coverage:

- Database: 82%
- Backend API: 84%
- Frontend page: 78%
- Workflow: 70%

Evidence:

- Models: `BOM`, `BOMItem`, `BOMRoutingStep`, `ProductionOrder`, `ProductionStage`, `ProductionTask`, `ProductionSchedule`, `ProductionLog`, `ProductionMaterialIssue`.
- APIs: production order CRUD, metrics, work centers/machines/schedules, BOM CRUD/clone/archive, material issues, logs, requirements, start, stage completion, stage-to-yard, tasks/assignments.
- Pages/routes: `/production`, `/production/boms`, `/production/orders`, `/production/material-issues`, `/production/logs`.

Missing tables:

- Formal BOM reservation documents.
- Production-material receipt/balance ledger independent of derived Inventory transaction view.
- Finished component costing ledger.
- Labor/machine actual cost and overhead allocation tables.
- Work-center/machine master tables if current endpoints are not backed by durable dedicated models.

Missing APIs:

- Reservation create/release/consume APIs.
- Manual production material issue return and approval APIs.
- Costing actuals APIs.
- Rich scheduling/capacity planning APIs.
- Machine/operator assignment workflow APIs beyond current task assignment baseline.

Missing pages:

- Reservation management.
- Manual issue/return approval workspace.
- Production costing page.
- Detailed scheduler/capacity board.

Missing workflows:

- Formal reservation before MO start.
- Manual issue corrections and returns with approvals.
- Finished component cost closeout.
- Full machine/operator capacity workflow.

## QC

Coverage:

- Database: 72%
- Backend API: 78%
- Frontend page: 72%
- Workflow: 58%

Evidence:

- Models: `QcChecklist`, `QcChecklistItem`, `QcInspection`, `QcResult`, `QcIssue`, `QcAttachment`, non-conformance models.
- APIs: checklist CRUD/update, inspection CRUD/update/start/results/issues/complete/approve/reject, NCR, cockpit, metrics.
- Page: `/qc` cockpit with tabs and production waiting queue.

Missing tables:

- Calibration equipment records.
- QC release certificate records.
- Rich evidence/file metadata if current attachment model is insufficient.
- Root-cause/corrective-action lifecycle fields or tables for NCR maturity.

Missing APIs:

- Full checklist result matrix save/update APIs if not completely wired in UI.
- Evidence upload/attachment lifecycle APIs.
- Calibration CRUD and due-alert APIs.
- QC release certificate generation/approval APIs.
- NCR root cause, corrective action, closeout APIs.

Missing pages:

- Checklist matrix entry page.
- Evidence attachment workspace.
- Calibration page.
- QC certificate page.
- Dedicated NCR lifecycle detail page.

Missing workflows:

- Full inspection evidence and checklist completion workflow.
- NCR lifecycle from issue to corrective action and closeout.
- Calibration due/overdue workflow.
- Formal QC release certificate before Yard shipment.

## Yard

Coverage:

- Database: 76%
- Backend API: 80%
- Frontend page: 76%
- Workflow: 60%

Evidence:

- Models: `YardZone`, `YardRow`, `YardSlot`, `YardItemPlacement`, `YardMovement`, `YardSnapshot`.
- APIs: zones/rows/slots, placements, move/remove, search, movements, metrics, cranes, snapshots.
- Pages/components: `/yard`, Yard cockpit/workspace, 2D/3D/map/tracking components.

Missing tables:

- Formal shipment/outbound document.
- Shipment staging document/lines.
- Crane telemetry history if current crane endpoints are not backed by durable telemetry.
- Yard return document linking Project/Inventory/Yard.

Missing APIs:

- Shipment document CRUD and approval APIs.
- Staging and loading confirmation APIs.
- Rich crane telemetry ingestion/history APIs.
- Yard return workflow APIs.

Missing pages:

- Shipment staging board.
- Outbound document page.
- Crane telemetry history page.
- Full Yard zone/slot administration if current CRUD is not exposed as a complete operator screen.

Missing workflows:

- Formal shipment/outbound lifecycle.
- Project return through Yard to Inventory.
- Realtime movement animation and telemetry-driven dispatch.
- Loading confirmation and delivery handoff.

## Suppliers

Coverage:

- Database: 55%
- Backend API: 68%
- Frontend page: 70%
- Workflow: 45%

Evidence:

- Models: `Supplier`, `SupplierScore`, master supplier categories, Inventory transaction supplier references, purchase/receiving models around procurement.
- APIs: supplier CRUD, cockpit summary, evaluations, supplier detail cockpit, supplier-score endpoints.
- Page: `/suppliers` with supplier master cockpit and evaluation tab.

Missing tables:

- Supplier-material mapping.
- Supplier contact records.
- Supplier contract records.
- Supplier document/attachment classification.
- Supplier score event/history table with evaluator/cycle/criteria weights.

Missing APIs:

- Supplier-material mapping CRUD.
- Contact and contract CRUD.
- Document upload/link APIs.
- Supplier score event/history APIs.
- Procurement linkage APIs for RFQ/PO lifecycle if handled outside purchase-orders.

Missing pages:

- Supplier-material mapping page.
- Contacts/contracts tabs.
- Document management page.
- Score history/detail page.

Missing workflows:

- Supplier qualification/review lifecycle.
- Supplier-material approval.
- Contract/document review.
- Score event history and next-review cycle.

## Projects

Coverage:

- Database: 42%
- Backend API: 35%
- Frontend page: 62%
- Workflow: 30%

Evidence:

- Model: `Project`.
- APIs: list/runtime/create.
- Pages: `/projects` cockpit/workspace and integration through Dashboard, Inventory outbound, Production, QC, Yard.

Missing tables:

- Contract fields/details.
- Milestones.
- Project material budgets.
- Planned/actual schedule baselines.
- Project documents/photos.
- Project return documents.

Missing APIs:

- Full project CRUD/update/status APIs.
- Milestone CRUD.
- Budget CRUD and budget-vs-actual APIs.
- Schedule baseline APIs.
- Document/photo attachment APIs.
- Project return workflow APIs.

Missing pages:

- Project detail page.
- Contract/milestone/budget tabs.
- Schedule baseline page.
- Documents/photos page.
- Project return workspace.

Missing workflows:

- Contract-to-execution lifecycle.
- Material budget planning and actual consumption.
- Schedule baseline tracking.
- Formal project return across Yard and Inventory.

## Dashboard

Coverage:

- Database: 25%
- Backend API: 55%
- Frontend page: 72%
- Workflow: 38%

Evidence:

- API: `GET /dashboard/cockpit`.
- Page: `/` DashboardPage.
- Aggregates Projects, Production, Components, Inventory, Yard, QC, Activity Logs, and Notifications.

Missing tables:

- Dashboard preferences.
- Saved widget layouts.
- User dashboard filters.
- Dashboard action/read-state records if separate from notifications.

Missing APIs:

- Dashboard preferences CRUD.
- Widget layout save/reset APIs.
- Drill-through metadata APIs.
- Dashboard action mutation APIs.

Missing pages:

- Dashboard customization page/modal.
- Widget library/configuration UI.
- Deep drill-through pages for all KPI cards.

Missing workflows:

- Persisted dashboard personalization.
- Actionable dashboard notifications.
- Drill-through from aggregate KPI to filtered operational page.

## Components

Coverage:

- Database: 78%
- Backend API: 72%
- Frontend page: 86%
- Workflow: 68%

Evidence:

- Models: `Component`, `ComponentTimeline`.
- APIs: component list/detail/timeline/create/upload/timeline-upload/update/delete.
- Pages/routes: `/components`, `/components/list`, `/components/production`, `/components/stock`, `/components/material-stock`, `/components/transfers`, `/components/qc`, `/components/history`.
- Strong integration with Production, QC, Yard, and Inventory production material stock.

Missing tables:

- Component costing ledger.
- Component material traceability ledger if current timeline is insufficient.
- Formal component transfer/shipment documents.
- Fabrication step actuals if not covered by Production stages/tasks.

Missing APIs:

- Costing APIs.
- Traceability APIs from material issue to finished component.
- Formal transfer/shipping document APIs.
- Component lifecycle approval APIs.

Missing pages:

- Component costing page.
- Material traceability detail page.
- Formal transfer/shipment document pages.

Missing workflows:

- End-to-end material-to-component traceability.
- Component cost closeout.
- Formal transfer/shipping lifecycle.
- Stronger link between component internal QC and global QC certificate workflow.

## Organizations

Coverage:

- Database: 0%
- Backend API: 0%
- Frontend page: 0%
- Workflow: 0%

Evidence:

- No active Organization model, backend module/controller, route, or frontend page found.
- Listed as 0% in `PROJECT_STATUS.md` and Not Started in `CURRENT_MODULES.md`.

Missing tables:

- Organization/company.
- Organization sites/factories.
- Departments/business units.
- Organization users/memberships if multi-company tenancy is required.

Missing APIs:

- Organization CRUD.
- Site/factory CRUD.
- Department CRUD.
- Membership/assignment APIs.

Missing pages:

- Organization management.
- Site/factory management.
- Department/business unit management.

Missing workflows:

- Multi-company setup.
- Factory/site scoping.
- User membership and permission scoping by organization.

## System

Coverage:

- Database: 70%
- Backend API: 58%
- Frontend page: 72%
- Workflow: 42%

Evidence:

- Models: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Notification`, `ActivityLog`; settings are currently derived from environment/existing data.
- APIs: overview, users, roles, role-matrix, activity-logs, activity-summary, notifications.
- Pages: `/settings`, `/users`, `/roles`, `/system-logs`, `/notifications`.

Missing tables:

- Persisted system settings.
- Backup job history.
- Audit export job records.
- Notification read/archive state if not complete in existing model.
- Configuration change approval records.

Missing APIs:

- User create/edit/lock/delete/password reset.
- Role create/edit/delete and permission assignment mutations.
- Notification mark-read/archive.
- Settings save/update.
- Audit export.
- Backup execute/restore.
- Configuration change approval.

Missing pages:

- Fully editable settings pages.
- Backup execution/history page.
- Audit export page.
- Permission assignment editor with save workflow.

Missing workflows:

- User lifecycle management.
- Role/permission mutation lifecycle.
- Notification read/archive lifecycle.
- Settings change approval.
- Backup and restore execution.
- Audit export generation.

## Cross-Module Risks

- Several modules have strong cockpit/page coverage but weaker durable workflow documents and mutation lifecycles.
- Inventory and Production rely on transaction and derived balance behavior that still needs formal ledgers for long-term audit maturity.
- Dashboard and System depend on mutation APIs that are not implemented yet.
- Organizations being 0% blocks future multi-company, multi-factory, and scoped permission expansion.

## Recommended Next Audit Actions

1. Add `docs/ai-state/modules/components.md` because Components is 79% in `PROJECT_STATUS.md` but lacks a normalized module doc.
2. Add `docs/ai-state/modules/organizations.md` once Organization scope is approved.
3. Re-run this audit after System Phase S2 and Production reservation/ledger work.
4. Add endpoint-by-endpoint API audit for Projects, Yard, Components, and System before implementation sprints.
