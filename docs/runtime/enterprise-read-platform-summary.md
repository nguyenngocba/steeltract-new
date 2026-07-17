# Enterprise Read Platform Summary

Status: **FOUNDATION IMPLEMENTED, UI CUTOVER PENDING**

## Completed

- One shared Outbox-driven projection engine.
- Twenty registered Production, Components, Inventory and cross-module projections.
- Transactional receipts, checkpoints, failures and documents.
- Resume/rebuild services over retained Outbox history.
- Existing Outbox retry/dead-letter integration.
- GET-only, JWT-protected, paginated Query API.
- Projection health, lag, counts and failure visibility.
- Unit coverage for idempotency, replay, failure propagation and dispatch ordering.

## Preserved

- Inventory, Production and Components aggregate/business implementations.
- AD-015, AD-016, AD-017 and AD-019 decisions.
- Existing APIs, snapshots, UI and database records.

## Certification Limits

- UI and existing cockpit/dashboard adapters were not changed because UI changes
  are explicitly out of scope. They cannot yet be certified as projection-only.
- The migration must be deployed before runtime projection processing can start.
- Inventory balance projections cannot be authoritative until owning events emit
  complete quantity/location facts or an approved truth-based bootstrap exists.
- Historical completeness is bounded by retained durable Outbox events.

The platform is ready for a controlled module-by-module query cutover after
migration deployment and payload parity validation. It is not valid to claim
that all current dashboards already read these projections.
