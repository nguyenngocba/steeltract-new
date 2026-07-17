# Projection Replay Validation

Date: 2026-07-17  
Database: local PostgreSQL `steeltrack`, real retained Outbox

## Migration

`20260717170000_enterprise_read_platform` was deployed successfully. No data was
reset and no event was rewritten.

## Full Replay

- Registered projections: 20.
- Retained Outbox rows scanned per projection: 90.
- Projection documents rebuilt: 142.
- Active failures: 0.
- Historical matches: 44 MaterialAvailability, 44 LocationBalance, 74
  StockMovementSummary and 44 ProductionVsInventory applications.
- No retained Production or Components canonical event existed at validation time.

## Idempotency

A second `resume` pass left checkpoint counts unchanged:

- MaterialAvailability: 44.
- LocationBalance: 44.
- StockMovementSummary: 74.
- ProductionVsInventory: 44.
- Documents remained 142; failures remained zero.

## Determinism

A complete rebuild before/after comparison excluded generated database ids and
storage timestamps and included projection name/key, schema, data and source
event facts.

- Before documents: 142.
- After documents: 142.
- Before SHA-256: `987fdfff0f484acc29170b5a086395d1908f22c893ec547310542e3e2e2ebb77`.
- After SHA-256: `987fdfff0f484acc29170b5a086395d1908f22c893ec547310542e3e2e2ebb77`.
- Deterministic: PASS.

Replay read only `OutboxEvent` plus projection-owned tables. It did not query
Inventory, Production or Components aggregates.
