# Inventory Table Visibility Root Cause

Date: 2026-07-18  
Status: **CONFIRMED**

## Symptom

`Tổng quan kho` and `Vật tư & Tồn kho` rendered their table shells and column
headers, but no material rows appeared.

## Trace

1. Both pages call `useInventoryMaterials()`.
2. The hook calls `getInventoryMaterials()` in
   `api/endpoints/inventory.endpoint.ts`.
3. That adapter imported `shared/http/http-client`, an Axios instance with no
   request authentication interceptor.
4. RFC017 made backend routes deny-by-default. A direct runtime request to
   `/inventory/materials?page=1&pageSize=16` returned HTTP `401 Unauthorized`.
5. React Query therefore exposed an error and no `data`; both pages evaluated
   `materialsData?.items ?? []` and rendered an empty `tbody`.

## Classification

**A - Backend data exists but never reaches the table.**

This was not filtering, row mapping, pagination, conditional rendering,
virtualization, permission UI, CSS overflow, sticky positioning or viewport
clipping. The table DOM remained visible; its authenticated datasource failed
before mapping.

## Runtime Evidence

- Unauthenticated materials request: HTTP `401`.
- Authenticated materials request: HTTP `200` with 25 records.
- Response contract: `{ items, page, pageSize, total, totalPages, summary,
  facets }`.
- A page-size-two request returned two correctly populated material rows.

## Root Cause

| Field | Finding |
| --- | --- |
| Root cause | Inventory read-model adapter used an unauthenticated Axios client after global JWT enforcement |
| File | `apps/frontend/src/modules/inventory/api/endpoints/inventory.endpoint.ts` |
| Line | Import at line 1 before the fix |
| Impact | React Query data was undefined; Overview and Materials silently rendered zero rows |
| Fix | Use the existing authenticated `api` client with JWT and refresh interceptors |

