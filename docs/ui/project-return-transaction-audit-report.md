# Project Return Transaction Audit Report

Date: 2026-07-01

## Problem

Project material return receipt was operationally correct but weakly described in Inventory history. Some UI paths could classify return rows as generic or adjustment-like because frontend normalization did not recognize `RETURN` in Material Detail history.

## Fix

Backend `PROJECT_RETURN_RECEIVED` now writes a normal Inventory `RETURN` transaction with:

* `referenceModule = return-workflow`
* `referenceId = returnRequestId`
* business `remarks = Nhận trả vật tư từ công trình {projectCode} - {projectName}`
* JSON `note` metadata:
  * `source = PROJECT_RETURN`
  * `transactionTypeCode = PROJECT_RETURN_RECEIVED`
  * `projectId`
  * `projectCode`
  * `projectName`
  * `returnRequestId`
  * `returnNo`
  * `taskId`
  * `taskName`
  * `materialId`
  * `materialCode`
  * `materialName`
  * `quantity`

ActivityLog metadata for `PROJECT_MATERIAL_RETURN_RECEIVED` now includes a human-readable message:

`Kho đã nhận lại {quantity} {materialName} từ công trình {projectCode}.`

## Frontend Presentation

Inventory transaction grid now recognizes Project Return transactions from `note.source = PROJECT_RETURN` or `referenceModule = return-workflow`.

Display:

* Type: `Trả từ công trình`
* Badge: `PROJECT RETURN`
* Object: `← Công trình ... · Phiếu ...`

Inventory Transaction Detail now shows:

* Nguồn
* Phiếu
* Task
* Người trả
* Số lượng
* Ngày

Material Detail history now recognizes `RETURN` and special-cases Project Return rows:

* icon: rotate/undo
* label: `Trả từ công trình`
* quantity: positive inbound quantity
* counterparty context: Project / Task / Return No when metadata is available

## Known Limitations

* `inventory_transactions` does not have a physical `transactionTypeCode` column. The value is preserved in transaction `note` metadata to avoid a schema change.
* Task metadata is currently null unless a task-level return path supplies it in a future sprint.
