# RFC011 Enterprise Query API Adoption

Status: **IMPLEMENTED**

## Implementation

The existing Enterprise Read Platform now exposes one module-oriented,
projection-only query boundary for Inventory, Components, Production, QC, Yard,
Logistics and Projects.

Additive authenticated GET routes:

- `GET /query-api/modules`
- `GET /query-api/modules/:moduleName`
- `GET /query-api/modules/:moduleName/:viewName`
- `GET /query-api/modules/:moduleName/:viewName/:entityKey`

`EnterpriseQueryService` maps stable module/view aliases to the existing
`ProjectionQueryService`. It has no repository, Prisma, command or aggregate
dependency and returns the existing paginated projection document contract.

The projection registry was extended, without changing the engine, for
canonical facts already published by:

- QC: inspection, NCR and disposition summary/timeline views.
- Yard: item, movement and loading views.
- Logistics: shipment summary and timeline views.
- Projects: material allocation, acceptance and timeline views.

Inventory, Components and Production reuse their existing projection views.
No synthetic projection data or aggregate fallback was introduced.

## ADR011 Boundary

Existing operator workspace endpoints remain Repository Live Read Models where
strong read-after-write is required. RFC011 does not replace those reads with
eventually consistent projections. Dashboard, analytics, cross-module and
explicit Query API consumers can now use the unified projection boundary.

Existing module routes and response contracts remain unchanged. Consumer
cutover can therefore be incremental and backward compatible.

## Verification

- Enterprise module/query and Projection Engine/Repository/Replay tests:
  **PASS** (`9/9`, five suites).
- Seven-module projection alias coverage: **PASS**.
- GET-only route validation: **PASS**.
- Backend build: **PASS**.
- Frontend build: **PASS**.
- Prisma validate: **PASS**.
- `git diff --check`: **PASS**.
- Schema/migration/command/business changes: **NONE**.
- Commit/stage: **NONE**.
