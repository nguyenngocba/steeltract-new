# Production API Compatibility

Date: 2026-07-17  
Status: **PASS**

## Boundary

- Existing controller prefix: `/production`.
- Additive controller prefix: `/production/commands`.
- No existing path, method, request schema or response shape was edited.
- Existing frontend continues to call legacy routes without requiring a new
  header or `expectedVersion`.

## Compatibility Policy

New integrations must use the command namespace. Legacy routes remain a
time-bounded compatibility surface because their bodies do not contain the
released engineering basis, deterministic Work Order definitions,
`expectedVersion` or durable idempotency key required by AD-017/019. The server
does not invent those values and does not silently reinterpret legacy calls.

Route metadata regression tests prove `POST /production/:id/release` remains
registered while `POST /production/commands/orders/:id/release` is additive.

## Breaking Change Check

Routes: none. DTOs: none. Responses: none. UI: none. Database: none.
