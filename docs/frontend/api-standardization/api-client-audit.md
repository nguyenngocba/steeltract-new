# Frontend API Client Audit

## Result

The active frontend now has one authenticated transport: `apps/frontend/src/lib/api.ts`.
It owns the backend base URL, 30-second timeout, JWT injection, refresh
coordination, one-time 401 replay, session update and terminal authentication
failure handling.

Socket.IO transports retain their separate realtime lifecycles but now consume
the same exported `API_BASE_URL`; they do not duplicate backend URL selection.

## Findings and remediation

| Finding | Before | Result |
| --- | --- | --- |
| Canonical authenticated client | `lib/api` | Retained and assigned the common timeout |
| Legacy shared client | `shared/http/http-client` created an unauthenticated Axios instance | Replaced by compatibility re-export of `lib/api` |
| Legacy shared API client | `shared/api/http` created another instance/interceptor | Replaced by compatibility re-export of `lib/api` |
| Inventory client | Created an authenticated module-specific instance | Removed; helpers and consumers use `lib/api` |
| Global Axios calls | Dashboard runtime and two workspace widgets bypassed interceptors | Replaced with `lib/api` |
| Direct `fetch`/XHR | None in active runtime source | No action required |

Axios interceptors are instance-scoped. The removed instances therefore could
not inherit the authentication pipeline from `lib/api`; that was the same
failure mode proven by BUGFIX INV001.

## Scope

The audit covered active TypeScript under `apps/frontend/src`. Direct transport
implementations under `_archived`, `_legacy_modules` and
`_experimental_archive` are excluded by `tsconfig.app.json` and are not runtime
code. Archived imports through the old shared paths remain safe because those
paths now re-export the canonical client instead of creating a transport.

## Static gate

Active runtime source contains no module-specific `axios.create`, direct
`axios.get/post/...`, authenticated `fetch`, `XMLHttpRequest`, `inventoryApi`,
or import of either legacy shared client. The only Axios instances are the
canonical authenticated client and its private anonymous refresh client.
