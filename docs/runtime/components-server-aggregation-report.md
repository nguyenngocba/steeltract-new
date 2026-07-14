# Components Server Aggregation Report

Date: 2026-07-12

## Moved From React

List:

- total/running/completed/waiting-material/delayed/weight KPIs;
- status/project/type/location filtering;
- search, sorting and pagination;
- material required/issued/remaining/readiness calculations;
- structure distribution, newest Components and project distribution.

Overview:

- status KPIs;
- Yard placement location mapping;
- type/profile distributions and total quantity;
- filter facets;
- recent Production progress and timeline activity series.

History:

- real timeline rows;
- search and pagination;
- completed/active/failed/passed summary and recent events.

## Query Strategy

- bounded page query with relation hydration for rows;
- `count`/`groupBy` for status and project summaries;
- top-5 query for recent Components;
- SQL aggregates for BOM readiness, estimated weight, metadata distributions and
  monthly ComponentTimeline activity;
- stable default order: `createdAt DESC`;
- query key includes page, search, filters and sort parameters;
- `keepPreviousData` avoids table collapse during page transitions.

No snapshot was created. All values are strong live reads from repository-owned
queries under ADR011.

## Limitations

Current database size is too small for a scalability claim. Offset pagination is
appropriate for the current workspace contract; deep-page cursor migration must
be based on a future benchmark. The dynamic `description` metadata remains a
legacy modeling constraint and is parsed without schema changes.

