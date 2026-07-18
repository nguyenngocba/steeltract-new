# API Client Migration Summary

## Migrated modules

- Inventory: materials, transactions, master data, zones and settings writes.
- Components, Production, Yard, Logistics and Projects: already used `lib/api`;
  no request contracts changed.
- QC and Suppliers: moved from the unauthenticated shared client to `lib/api`.
- Administration/runtime: Settings already migrated for Inventory writes;
  runtime overview, telemetry and event history now use `lib/api`.
- AI, Workflow, ERP, HRM, Tracking, CMMS and MES: moved to `lib/api`.
- Authentication: the legacy login adapter now delegates to canonical
  `lib/auth/auth-api`.
- Realtime transports: retain existing Socket.IO event lifecycles while sharing
  `API_BASE_URL` with the HTTP client.

## Preserved behavior

Endpoint paths, methods, request payloads, response shapes, DTOs, query keys,
React Query hooks, pagination, filters and sorting were unchanged. No backend,
route, permission or business behavior was modified.

## Compatibility

`shared/http/http-client` and `shared/api/http` remain as thin compatibility
exports for excluded archive source. They create no client and register no
interceptor. New runtime code must import `api` from `lib/api` directly.

## Verification

TypeScript/Vite and backend builds pass. Static inspection proves that all
active module adapters share the same transport. Authenticated HTTP smoke is
pending because the local backend cannot pass startup without PostgreSQL at
`localhost:5432`; the sprint did not alter or initialize the database.
