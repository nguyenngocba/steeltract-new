# Projection Health

`GET /query-api/projections/health` returns one row for each registered
projection with:

- status: `NOT_INITIALIZED`, `HEALTHY` or `DEGRADED`;
- schema version and document count;
- processed and failed counts;
- active failures;
- last observed lag in milliseconds;
- last processing time and error.

Lag is measured from the source event occurrence time to projection processing.
Projection failures remain visible until a successful application resolves them.

The health endpoint is additive and JWT-protected. Operations Center can consume
it later without changing current UI. This sprint does not claim an Operations
Center UI cutover.
