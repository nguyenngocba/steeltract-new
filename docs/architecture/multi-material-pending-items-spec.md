# Multi-material Pending Items Specification

Date: 2026-07-14  
Status: **READY FOR UI DESIGN, NOT IMPLEMENTATION IN EPIC182**

## Pending Entry

Each business entry requires a client-only stable `pendingId` plus:

- material ID/code/name;
- unit;
- quantity;
- warehouse, Zone, Slot, Level IDs and display labels;
- unit price/value inputs when applicable;
- workflow-specific reason, disposition, project/supplier context;
- transfer source and destination buckets when applicable;
- future lot/batch/serial identifiers only after backend approval.

Display labels are never submitted as identity in place of IDs.

## Header Summary

The Pending header must expose business truth, not one misleading combined
quantity:

- distinct material count: `5 vật tư`;
- pending entry count when different: `7 dòng`;
- quantity grouped by unit: `25 t; 120 cái`;
- total weight only when every line has authoritative conversion data;
- total value when determinable under the workflow valuation rule;
- an action to view/review the Pending list.

Do not show total quantity or weight as `0` when it is unknown. Use
`Chưa xác định`.

## Required Actions

Every Pending entry supports:

- **Edit** material attributes allowed by the workflow;
- **Change location** through the existing 2D/location selector;
- **Change quantity** with full revalidation;
- **Remove** from Pending with no server effect.

Bulk edit, spreadsheet paste, drag/drop reorder, duplicate-row cloning, and
server-side drafts are outside Phase 1.

## Add and Merge

- Add validates the current editor.
- Exact duplicate identity automatically merges quantity.
- A visible non-blocking notice identifies the merged entry and new quantity.
- Different bucket/business identity creates a separate entry.
- Merge never combines different units, prices, tracking identities, reasons,
  dispositions, or transfer routes.

## Edit Semantics

- Editing removes the entry from aggregate calculations only within the edit
  transaction, then reapplies the edited result atomically to local state.
- If the edit becomes an exact duplicate, it merges into that target entry and
  the edited entry is removed.
- If validation fails, the original Pending entry remains unchanged.

## Empty, Dirty, and Submit States

- Empty Pending: Confirm disabled.
- Dirty current editor not added to Pending: Confirm must warn/focus the editor;
  it must not silently omit the line.
- Valid Pending: Confirm enabled unless mutation is in flight.
- In-flight: Add/Edit/Remove/Confirm disabled; drawer remains visible.
- Failed submit: all Pending entries remain editable.
- Successful submit: clear all local transaction state.

## Workflow Adaptation

| Workflow | Pending business entry | Special behavior |
|---|---|---|
| Inbound | One material at one destination | Location and editable price required by current rules |
| Outbound | One material from one source | Aggregate source stock validation |
| Transfer | One material source/destination pair | Produces two canonical lines; one route/material in Phase 1 |
| Adjustment | One material/location variance | Reason/evidence must remain line-specific before rollout |
| Stock Take | One counted material/location variance | Existing count workflow remains authoritative; generic Pending UI is not automatically reused |
| Return | One return/disposition item | Existing Return Request lifecycle remains authoritative |

## Accessibility and Operator Safety Requirements

Implementation must preserve keyboard operation, focus the first invalid field,
announce Pending count/merge/error changes, and protect against accidental ESC,
backdrop, route-change, or browser-navigation loss. These are behavior
requirements, not a visual redesign specification.
