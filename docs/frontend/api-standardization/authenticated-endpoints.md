# Authenticated Frontend Endpoints

## Standard

All active backend requests use the Axios instance exported by `lib/api`.
RFC017 protects routes by default, so reads and writes are authenticated unless
the backend explicitly marks the route public.

| Area | Frontend path | Authentication pipeline |
| --- | --- | --- |
| Inventory | `/inventory/*`, `/master-data/*` | Canonical client |
| Components | `/components/*` | Canonical client |
| Production | `/production/*` | Canonical client |
| QC | `/qc/*` | Canonical client |
| Yard | `/yard/*` | Canonical client |
| Logistics | `/logistics/*` | Canonical client |
| Projects | `/projects/*` | Canonical client |
| Suppliers | `/suppliers/*` | Canonical client |
| Administration/System | `/system/*`, `/operations-center/*`, master data | Canonical client |
| Runtime/Telemetry | `/runtime/*`, `/telemetry`, `/runtime-events` | Canonical client |

## Public exceptions

- Health root: public backend probe; no active application data adapter needs a
  separate client.
- `POST /auth/login`: public command routed through canonical auth API.
- `POST /auth/refresh`: public command. Automatic refresh uses the private
  interceptor refresh client so a failed refresh cannot recursively retry
  itself.

There are no active anonymous metadata clients or duplicate refresh pipelines.
