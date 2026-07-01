# Inventory Return Drawer Polish Report

Date: 2026-07-01

## Scope

Polished the Inventory Return Request detail UX and Project Pending Return drill-down.

## Inventory Return Request Detail

File:

* `apps/frontend/src/modules/inventory/pages/tabs/InventoryReturnRequestsPage.tsx`

Changes:

* Uses `ModuleDetailDrawer size="sm"`.
* Header shows `Phiếu trả vật tư {returnNo}`.
* Status badge appears in the header action area.
* Subtitle shows Project, requester, and created date.
* Body sections:
  * Thông tin phiếu
  * Danh sách vật tư trả
  * Timeline
  * Photos
  * Logs

## Project Pending Return Detail

File:

* `apps/frontend/src/modules/projects/pages/ProjectsPage.tsx`

Changes:

* Pending Return numbers now open a small right-side drawer instead of navigating away.
* Drawer uses real `ProjectsRuntime.returnRequests`.
* Drawer table shows:
  * Return No
  * Status
  * Quantity
  * Created At
  * Requested By
* Clicking a row shows a detail panel below the table.

## Known Limitations

* Return request photos still show empty state until attachments are linked to return requests.
* Pending Return drawer uses runtime return-request data already returned by Projects; it does not introduce a separate live refresh API.
