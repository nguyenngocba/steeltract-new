# Production-Inventory Consistency Matrix

Date: 2026-07-17  
Status: **APPROVED - ADS003.5**

| Production operation | Inventory query | Inventory mutation | Transaction mode | Production result | Inventory result | Projection trigger |
| --- | --- | --- | --- | --- | --- | --- |
| Create Reservation Draft | Optional availability preview | None | Production local | Draft demand | None | None |
| Reserve Material | Live exact-bucket availability | None | Production local with reservation concurrency control | Reservation allocation + ledger | None | Production reserved fact |
| Release/Expire Reservation | None required | None | Production local | Remaining allocation released + ledger | None | Production released fact |
| Issue Material | Inventory revalidates stock | Outbound posting | Shared local atomic transaction | Issue + reservation progress + ledger | Inventory transaction + stock/valuation + receipt | Owner Outboxes after commit |
| Consume Material | Optional valuation/read | None | Production local | Consumption + ledger | None | Production consumed fact |
| Record Partial Completion | None | None | Production local | Append completion record | None | Production completion fact |
| Finalize Completion | No stock query required; reconcile stored receipts/ledger | None | Production local | Order `COMPLETED` | None | Production finalized/order fact |
| Return Material | Inventory validates destination | Inbound return posting | Shared local atomic transaction | Return balance + ledger | Inventory transaction + stock/valuation + receipt | Owner Outboxes after commit |
| Post non-recoverable Scrap | None | None | Production local | Scrap + ledger | None | Production scrap fact |
| Receive recoverable Scrap | Inventory validates item/destination | Explicit inbound posting | Shared local atomic transaction | Scrap recovery reference | Inventory transaction + stock/valuation + receipt | Owner Outboxes after commit |
| Close Production Order | None | None | Production local | Order `CLOSED` after reconciliation | None | Production closed fact |

## Read Consistency

- Operator Inventory stock reads Inventory live read models.
- Operator Production material balances read Production live read models.
- Dashboards remain snapshot-first under ADR011 and may be eventually
  consistent after the command commits.
- Cross-module UI composition may correlate receipts/events but cannot replace
  either owner query.

## Retry And Replay

- HTTP/application retry reuses the original idempotency key.
- Outbox retry replays publication/projection only, never the stock mutation.
- A consumer must be idempotent by event id plus schema version.
- A failed projection does not roll back a committed domain transaction.

ADS004 will define the common envelope, event identifiers, version and retry
metadata. This matrix fixes only interaction semantics.

