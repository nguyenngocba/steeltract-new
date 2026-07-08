# QC Module

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
