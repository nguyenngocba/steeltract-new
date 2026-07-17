# Cross-module Command Matrix

Date: 2026-07-17  
Status: **APPROVED - ADS001**

ADS003.5 / AD-018 is normative for Production-Inventory command responses,
PostingReceipt idempotency and no-double-stock behavior.

## Command Rule

Commands go to the module that owns the target aggregate. The calling module
supplies intent and references; it never writes the target tables.

| Caller | Owner/command boundary | Command purpose | Consistency | Forbidden shortcut |
| --- | --- | --- | --- | --- |
| Production | Inventory / `InventoryPostingService` | Post material Issue | Same local DB transaction | Production writes Inventory transaction/location stock |
| Production | Inventory / `InventoryPostingService` | Post unused material Return | Same local DB transaction | Generic client-side Inventory return |
| Production | Inventory recoverable-material receipt boundary | Receive explicitly approved recoverable Scrap as controlled stock | Same local DB transaction | Automatic generic Adjustment for every Production Scrap |
| Projects | Inventory return receipt boundary | Receive approved site material return | Owner transaction; event reconciliation to Projects | Projects writes Inventory stock |
| Suppliers | Inventory receiving boundary | Receive goods against purchase commitment | Inventory transaction; supplier reference retained | Suppliers writes Inventory stock |
| Logistics | Inventory outbound boundary | Post material/component stock consequence when applicable | Owner transaction | Logistics writes Inventory transaction tables |
| Components/Projects | Production command service | Create/release Production Order from released Component/BOM demand | Production transaction | Components writes Production Order tables |
| Production | QC inspection request boundary | Request inspection when synchronous acknowledgement is required | Prefer event; command only for explicit operator request | Production writes QC inspection/result |
| QC | Production rework command boundary | Create approved rework execution | Production transaction after QC request/event | QC changes Production status/order directly |
| Logistics | Yard allocation command boundary | Reserve items/slots for loading plan | Yard transaction, normally before loading | Logistics writes Yard placement |
| Yard | Logistics loading confirmation boundary | Confirm physically loaded items | Prefer Yard event; explicit command only for reconciliation | Yard changes Dispatch status directly |
| Logistics | Projects delivery intake boundary | Register delivery handoff reference | Prefer Logistics event and Projects acceptance command | Logistics changes WBS/install state |
| Projects | Components command boundary | Link/allocate released component identity when required | Components identity transaction or Projects allocation transaction according to target | Projects changes Component lifecycle directly |

## Commands That Remain Internal

- Inventory transfer, adjustment and stock take.
- Component revision/release/archive.
- Production lifecycle, reservation and consumption.
- QC inspection/result/NCR lifecycle.
- Project WBS and allocation lifecycle.
- Yard placement/movement lifecycle.
- Supplier commercial lifecycle.
- Logistics dispatch/shipment/delivery lifecycle.

## Shared Transaction Restrictions

Shared transaction context is permitted only when:

1. both writes use owner-exported services;
2. both modules use the same local database transaction;
3. failure must roll back both facts to preserve an invariant;
4. each owner writes its own Outbox event;
5. no foreign repository/model call escapes the owner boundary.

All other collaboration uses Outbox and idempotent consumers.
