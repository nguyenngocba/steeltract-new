# Enterprise Query API

Base path: `/query-api/projections`. All routes require JWT authentication and
are GET-only.

| Method | Route | Result |
| --- | --- | --- |
| GET | `/query-api/projections` | Projection catalog and schema versions |
| GET | `/query-api/projections/health` | Checkpoint, lag and failure health |
| GET | `/query-api/projections/:name` | Paginated projection documents |
| GET | `/query-api/projections/:name/:entityKey` | One projection document |

List query parameters are `page`, `limit`, optional `scopeKey` and optional
`state`. The maximum page size is 200. Results use stable source occurrence and
row-id ordering and include pagination metadata.

The API is additive. Existing module APIs and response contracts were not
removed or modified. No command, replay or rebuild route is exposed.
