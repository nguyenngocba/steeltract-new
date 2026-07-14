# QC Module

## Core Platform v1.0 Certification

Status: **PASS** (EPIC174, 2026-07-13)

Repository, ADR011 live workspace, snapshot-first Dashboard, Runtime naming,
Operations Center and existing atomic audit/domain/notification Outbox paths
pass the final platform parity rerun.

## EPIC173 Dashboard Certification

Status: **APPROVED** (2026-07-13)

`GET /qc/dashboard` now exposes `QcSnapshotReadService`. The explicit Dashboard
route binds KPI, defect aggregate and real trend to persisted snapshot data.
Inspection rows and Production queue embedded in the page, plus every operator
tab, remain repository live read models. Fallback and background rebuild behavior
are preserved without UI or workflow changes.

## Snapshot Foundation

EPIC153 completed on 2026-07-13.

Status: **APPROVED, EVENT FRESHNESS PARTIAL**

- `QcDashboardSnapshot`: persisted reusable dashboard summary.
- `QcInspectionSnapshot`: persisted reusable inspection summary.
- `QcSnapshotRepository`: live calculation/read/upsert boundary.
- Shared Reader/Writer/Validator/Rebuilder/Dispatcher: PASS.
- `USE_QC_SNAPSHOT`: registered with standard semantics.
- Missing/stale fallback and background refresh: PASS.
- Existing QC event routing: PASS for started/completed/issue/NCR/rework.
- Create/approve/reject/update event coverage: deferred, not invented.
- Workspace remains Repository Live Read Model under ADR011.
- Migration deployed; no snapshot backfill performed.

## Workspace Live Read Model

EPIC152 completed on 2026-07-13.

Status: **APPROVED FOR ACTIVE QC WORKSPACE**

- Active workspace endpoint: `GET /qc/read-model/workspace`.
- Server-owned search, status filter, sort, pagination and KPI aggregation.
- Dedicated live detail, paginated inspection history and NCR summary APIs.
- Real 30-day QC trend buckets; no synthetic dates or values.
- React query key includes all workspace query parameters.
- Existing `/qc/cockpit` remains backward compatible.
- JSX layout, Tailwind, dialogs, workflow and business rules are unchanged.
- Dashboard Snapshot and Runtime integration remain EPIC153-154 scope.

## Repository Foundation

EPIC151 completed on 2026-07-13.

Status: **APPROVED, 100% QC SERVICE COVERAGE**

- `QcService -> QcRepository/QcCockpitRepository -> Prisma`: PASS.
- Direct Prisma access in QC services: none.
- Checklist, Inspection, Result, Issue and NCR transactions: repository-owned.
- Operational code generation: repository-owned.
- Existing domain/audit/notification Outbox writes: atomic with QC mutation.
- Event names, payloads, APIs, UI and workflow semantics: unchanged.
- ADR011 read-model, Snapshot, Runtime and Operations Center work remains
  EPIC152-154 scope.

## Core Platform Audit

EPIC150 completed on 2026-07-13.

Status: **FOUNDATION BLOCKED (~31% COMPLIANCE)**

- Repository: partial; `QcService` still injects Prisma for Cockpit and codes.
- ADR011: violated by one shared `/qc/cockpit` payload for dashboard/workspaces.
- Server pagination: available on list APIs but not used by active QC pages.
- Snapshot, feature flag and parity: absent.
- Module runtime metrics and Operations Center health: absent.
- Event/Outbox: partial and not atomic with business mutations.
- Workflow: core inspection/result/issue/NCR records exist; transition guards,
  NCR lifecycle and linked reinspection remain incomplete.
- Current database: 2 checklists; 0 inspections/results/issues/NCRs.
- EPIC150 changed documentation only.

## Architecture Design

Thiết kế chi tiết cho phân hệ QC được đặc tả tại [qc-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/qc-blueprint.md).

## Scope

QC Phase S1 implements an operational quality cockpit connected to Production and Components.

Included:

* QC dashboard for inspections, checklists, NCR, and completed production orders.
* QC inspection creation from completed Manufacturing Orders.
* Pass/rework actions from the QC detail workspace.
* Production-to-Yard release gate based on linked QC inspection status.
* Placeholder areas for calibration and formal QC reports.

Excluded in S1:

* Full checklist item result entry UI.
* Evidence/file upload.
* Calibration database workflow.
* QC release certificate.
* Approval workflow beyond existing inspection approve endpoint.

## Routes

* `/qc`

The active route now renders the QC cockpit with module tabs.

## API

Existing:

* `GET /qc/checklists`
* `POST /qc/checklists`
* `GET /qc/inspections`
* `GET /qc/inspections/:id`
* `POST /qc/inspections`
* `PUT /qc/inspections/:id`
* `POST /qc/inspections/:id/start`
* `POST /qc/inspections/:id/complete`
* `POST /qc/inspections/:id/approve`
* `POST /qc/inspections/:id/reject`
* `GET /qc/ncr`
* `GET /qc/metrics`

Added in S1:

* `GET /qc/cockpit`
  Returns metrics, inspections, checklists, NCR, completed production orders waiting for QC, and derived analytics by category and project.

Related gate:

* `POST /production/:id/stage-to-yard`
  Now requires a linked QC inspection with status `PASSED` or `APPROVED` before staging the finished component to Yard.

## Implemented Features

* Seven QC tabs:
  * Tổng quan.
  * Phiếu kiểm tra.
  * Kế hoạch QC.
  * Tiêu chuẩn.
  * Không phù hợp (NCR).
  * Hiệu chuẩn thiết bị.
  * Báo cáo.
* KPI strip for total inspections, passed, failed/rework, waiting, open NCR, and completed MOs waiting for QC.
* Filter bar matching the cockpit layout.
* Main inspection table linked to Project, Component, ProductionOrder, Checklist, Result, Status, and inspector.
* Latest inspection panel with pass rate and related production/component data.
* Completed production queue where each completed MO can open a popup and create a QC inspection.
* Direct `Tạo phiếu kiểm tra cấu kiện` modal from the QC header:
  * select a completed MO/component waiting for QC;
  * create a ready inspection;
  * or create and approve/pass immediately to unlock Yard staging.
* Inspection detail popup with start, pass/approve, and rework actions.
* Quick pass/approve workflow supports newly created `READY` inspections and no longer requires the UI to complete a separate start transition first.
* Checklist standard cards from existing QC checklist data.
* NCR table and status summary from existing NCR data.
* Report panels and calibration placeholders prepared for Phase S2.
* Removed unused QC stub/static frontend files.

## Remaining Features

* Add editable checklist result matrix per inspection item.
* Add inspector/user display names instead of raw user ids.
* Add image/evidence attachments.
* Add NCR lifecycle actions and root-cause/corrective-action workflow.
* Add calibration equipment records and due-date alerts.
* Add QC release certificate before Yard shipment.
* Add richer analytics by project, component type, production stage, and supplier/material source.
* Add direct deep-link routes for inspection and NCR details if needed.

## Integration Points

* Production:
  Completed production orders feed the QC waiting queue.
* Components:
  QC rows display component code/name and release status.
* Yard:
  Finished components cannot be staged to Yard until linked QC is passed or approved.
* Projects:
  QC analytics are grouped by project when production/component/project links are available.
# EPIC154 Runtime Platform

## Status

- Repository Foundation: PASS
- Live Read Model / ADR011: PASS
- Snapshot Foundation: PASS
- Runtime Metrics: PASS
- Operations Center Integration: PASS
- Snapshot Parity: PASS (warning-only)
- Event Freshness: PARTIAL (existing approved events only)

## Runtime Contract

- Dashboard and analytics use persisted QC snapshots with repository fallback.
- Operator workspaces use repository live read models.
- The shared runtime platform records QC snapshot hit/miss/age/lag, fallback, and read-model hits.
- Operations Center reports QC repository, read-model, snapshot, feature-flag, background-job, outbox, parity, and runtime health.
- No UI, API, business workflow, read-model semantics, snapshot schema, or feature semantics changed in EPIC154.
