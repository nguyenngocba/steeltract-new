# Project Return Drawer Polish Report

Date: 2026-07-01

## Scope

Polished the Inventory Return Requests detail drawer used to process Project material pending returns.

## Changes

* Return Request detail now opens as a right-side drawer.
* Drawer sizing:
  * default width: `55vw`
  * `minWidth`: `760px`
  * `maxWidth`: `900px`
* Header now reads `Phiếu trả vật tư` and shows Project + Material context.
* Detail summary now includes:
  * Return No
  * Status
  * Quantity
  * Created At
  * Requested By
  * Task when metadata/remarks provide it
* Body shows material return lines in a compact grid.
* Existing actions remain:
  * `Nhận hàng`
  * `Từ chối`

## Data Rules

No fake data is shown. Photos remain an explicit empty state until return-request attachments are linked.

## Known Limitations

* Task context is shown only when available in return metadata/remarks. Current project-level return creation does not yet persist taskId.
