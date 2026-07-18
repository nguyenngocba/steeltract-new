# Legacy Clients Removed

## Removed runtime behavior

- `shared/http/http-client`: no longer creates an unauthenticated 30-second
  Axios instance.
- `shared/api/http`: no longer creates a 15-second client or a duplicate error
  interceptor.
- `modules/inventory/api/inventory.api`: no longer creates and configures a
  second authenticated instance.
- Dashboard runtime, telemetry and event-history reads no longer call the
  global Axios API with hard-coded absolute URLs.

## Guardrail

The two old shared import locations only re-export `lib/api` for archive
compatibility. They are not approved imports for new active code. Static review
must reject new `axios.create`, direct Axios verbs, authenticated `fetch`, or
module-specific interceptor registration outside `lib/api` and
`lib/auth/auth-interceptor`.

The private `refreshClient` is intentional and anonymous. It has no interceptor
and exists only to call the public refresh endpoint without recursion.
