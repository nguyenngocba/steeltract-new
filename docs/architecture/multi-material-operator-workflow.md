# Multi-material Operator Workflow

Date: 2026-07-14  
Status: **APPROVED SPECIFICATION**  
Implementation: Not part of EPIC182

## Purpose

Preserve the existing Drawer and 2D location workflow while allowing one
Inventory document to contain multiple materials. Pending Items is a local
command buffer. It is not a stock reservation, draft transaction, or second
inventory ledger.

## Canonical Operator Flow

```text
Open transaction drawer
  -> complete document header
  -> select Material A
  -> select warehouse/Zone/Slot/Level in 2D view
  -> enter quantity and line attributes
  -> Add to Pending
  -> validate and merge/add locally
  -> reset line editor, retain document header
  -> repeat for Material B..N
  -> review Pending Items
  -> Confirm once
  -> POST one transaction with items[]
  -> server validates all lines and commits atomically
```

## State Ownership

| State | Owner | Persistence |
|---|---|---|
| Document header | Drawer local state | Until successful submit or explicit discard |
| Current line editor | Drawer local state | Reset after Add to Pending |
| Pending Items | Drawer local state | Not sent until Confirm |
| Stock availability preview | React Query live-read data | Advisory only |
| Posted transaction | Inventory backend | Created only by the final API call |

Pending Items must not update stock, call a reserve endpoint, publish events, or
write browser-persistent drafts. A future draft feature requires a separate
business decision.

## Step Responsibilities

### Open Drawer

- Initialize an empty header, empty current line, and empty Pending Items.
- Load only data already required by the current workflow: materials, allowed
  warehouses/locations, and live stock for issue/transfer workflows.
- Do not create a transaction or reserve stock.

### Add to Pending

- Run line validation in the approved order.
- Resolve exact duplicates using the merge rule.
- Run provisional aggregate stock validation against the complete Pending set.
- If valid, add/merge the line and reset only the line editor.
- Retain supplier, project, dates, remarks, attachments, and other header data.
- Do not call the transaction API.

### Edit Pending

- Load the selected pending entry into the line editor.
- Keep its stable client-only `pendingId` while editing.
- Revalidate the entire Pending collection when the edit is applied.
- Cancel Edit returns the unchanged entry to Pending.

### Confirm

- Require at least one Pending entry.
- Re-run client validation for every entry and aggregate stock demand.
- Transform business entries into canonical `items[]`. Transfer entries produce
  one negative source and one positive destination line per material.
- Make exactly one mutation request.
- Disable repeated Confirm while the request is in flight.
- Do not auto-retry a timed-out mutation until durable public request
  idempotency is implemented.

### Success

- Clear Pending Items and current line only after a confirmed successful API
  response.
- Use the existing Inventory query-invalidation behavior.
- Dashboard remains snapshot-first and may update later.

### Failure

- Keep the document header and all Pending Items.
- Focus the failing line when the server identifies it.
- Show the server error without deleting successful-looking local entries.
- No transaction is considered posted unless the API confirms success.

## Close and Cancel

- Clean drawer with no Pending Items and no dirty current line: close directly.
- Any dirty header, current line, attachment selection, or Pending Item: show one
  discard confirmation for ESC, backdrop, Close, route change, or Cancel.
- Confirm discard: delete local state and close.
- Reject discard: remain in the drawer with all state intact.
- No automatic draft save. Browser refresh/navigation may lose unsaved work;
  implementation should use the same unsaved-change guard as drawer close.

## Atomicity

The final request is one business command. If line 4 of 5 fails server
validation or persistence, the complete transaction, all stock effects, audit
records, and Outbox records roll back. Partial posting is forbidden.
