# Production Material E2E Report

Date: 2026-07-11

## Automated Verification

Command:

```bash
pnpm -C apps/backend-api test -- --runInBand \
  event-consumer.service.spec.ts \
  production-material-ledger.service.spec.ts \
  material-issue.service.spec.ts \
  production-reservation.service.spec.ts \
  production-consumption.service.spec.ts \
  inventory-posting.service.spec.ts \
  production-order-state-machine.spec.ts
```

Result: 7 suites, 24 tests, all PASS.

Validated boundaries:

- Draft reservation has no ledger/event side effect.
- Issue uses one transaction client for Inventory posting, Production ledger,
  and Production Outbox.
- Consumption publishes consumed quantity only.
- Inventory posting rejects insufficient exact-location stock before writes.
- All canonical material events route to Production Order snapshots.
- Production Order state-machine regression suite remains green.

## Real Runtime Evidence

Read-only database inspection found:

```text
Production Orders: 1
Reservations: 0
Material Issues: 1
Consumptions: 0
Canonical material Outbox rows: 0
Production snapshot jobs: 0
```

The only Production Order is existing business data and is not a safe disposable
fixture. No fake or persistent test data was created. Therefore the complete
operator sequence Create -> Release -> Ready -> Start -> Reserve -> Issue ->
Consume -> Return -> Complete -> Close, including worker dispatch and Operations
Center observation, remains BLOCKED pending a designated real test order.

## Gate

Implementation and automated transaction-path verification: PASS.

Real-data operator E2E and post-dispatch snapshot/runtime observation: BLOCKED.

