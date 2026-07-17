# Production Command API Rollout

Date: 2026-07-17  
Status: **IMPLEMENTED - ADDITIVE**

EPIC188 exposes the RFC002 application boundary under
`/production/commands`. `ProductionCommandController` performs authentication,
Zod request validation and command-context construction, then calls
`ProductionCommandService`; it contains no business or persistence logic.

Every endpoint requires `Idempotency-Key`. Optional `X-Correlation-Id` and
`X-Causation-Id` flow unchanged into the AD-019 envelope. Commands carrying an
existing aggregate require a positive `expectedVersion`; stale versions return
HTTP 409 before timeline, audit or domain Outbox writes.

The existing `/production`, `/production/:id/*`, material and reservation
routes remain registered and unchanged. No frontend, Inventory, schema or
migration changed.

Result: command routes **PASS**; compatibility routes **PASS**.
