# Atomic Outbox Certification

## Result

**PASS** for Inventory, Components, Production, QC and Yard.

## Remediation

### Inventory

- Return Request create/approve/receive/inspect/dispose/reject now update state,
  write existing Activity Logs where applicable, and insert audit/domain Outbox
  rows through one `InventoryRepository.transaction` client.
- Inventory material and transaction events now use repository Outbox writes
  inside their owning transactions. The former `publishPersistent` path was
  removed.
- Existing event names and payload meanings are retained. Existing stock-bucket
  and material-update events are routed by the shared Event Consumer.

### Components

- `component.updated` is inserted in the same transaction as Component update,
  timeline and Activity Log.
- Component Activity Logs now receive the standard atomic
  `audit.activity.created` Outbox row.
- Post-commit `EventBusService.emit` calls were removed.

### Production

- `production.stage.completed` is inserted in the stage-completion transaction.
- `production.staged.to-yard` is inserted atomically with the Production-side
  Component status/timeline/log marker.
- Production Activity Logs receive atomic audit Outbox rows. Canonical
  `production.order.*` and `production.material.*` paths remain unchanged.

### QC And Yard

Existing repository transaction tests remain the reference control: business,
Activity Log, audit Outbox and domain/notification Outbox share one transaction
client.

## Verification

The focused suite proves transaction-client identity and command rejection on
Outbox failure. Static scan found no target module service calling
`publishPersistent` or persisting through `EventBusService` after commit.
