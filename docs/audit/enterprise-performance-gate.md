# Enterprise Performance Gate

Date: 2026-07-07

Scope: EPIC 101 / Sprint ARCH.1.

This document defines the performance gate SteelTrack should apply before adding or changing high-volume read paths. It is intentionally documentation-only: no API, schema, workflow, or UI behavior was changed.

## Performance Classes

### Dashboard / Cockpit

Target:

* Current acceptable p95: <= 1200 ms.
* Enterprise target p95: <= 500 ms using persisted read models or snapshots.
* Maximum live aggregate budget: 3 bounded aggregate queries per request.

Rules:

* Must not scan unbounded transaction, log, movement, or ledger tables.
* Must use a read model, cached source query, or persisted snapshot once source tables exceed operational scale.
* Must not return raw row lists when the UI only needs counts, trends, or top-N summaries.
* Recent activity lists must be explicitly bounded with `take`.

Current baseline:

* Inventory dashboard data now uses an internal cached read model through `DashboardInventoryReadModelService`.
* Dashboard executive services still read several operational sources directly and should move to persisted snapshots after KPI definitions stabilize.

### Detail

Target:

* Current acceptable p95: <= 800 ms.
* Enterprise target p95: <= 400 ms for a single active tab.
* Maximum query budget: 5 bounded queries for the active tab.

Rules:

* Detail screens should load the active tab only.
* Attachment-heavy, log-heavy, or history-heavy sections must be lazy-loaded by tab.
* Includes deeper than two relation levels require a comment or audit note explaining why the aggregate must be loaded together.
* Full runtime payload slicing is allowed only as a temporary compatibility boundary.

Current baseline:

* Project Detail has a tab-scoped API boundary.
* Inventory Material Detail attachment-heavy data is tab-gated.
* Logistics dispatch detail has a dedicated detail query.

### Lookup

Target:

* Current acceptable p95: <= 200 ms.
* Maximum result count: 50 by default, 100 only when justified.

Rules:

* Lookup queries must be indexed by exact key, status, active flag, or prefix field.
* Lookup responses should return minimal display fields.
* No broad relation include is allowed in simple dropdown/select endpoints.

### Search / List

Target:

* Current acceptable p95: <= 700 ms.
* Enterprise target p95: <= 350 ms with indexed predicates and stable pagination.

Rules:

* Pagination is required.
* `take` is required for list endpoints.
* Search predicates must use indexed fields or a future full-text/trigram strategy.
* Sorting must use an indexed or low-cardinality field for high-volume tables.

## Gate Checklist

Every new or materially changed endpoint that touches high-volume tables must answer:

* Is the endpoint Dashboard, Detail, Lookup, Search/List, Command, or Audit?
* What is the row cardinality today and at 100M+ records?
* Does every list query have `take`/pagination?
* Does every order/filter pair have an index plan?
* Does the endpoint load more columns/relations than the UI consumes?
* Is there any query inside a loop?
* Is there any include chain deeper than two levels?
* Is a read model/snapshot required before enterprise rollout?
* What is the fallback if a snapshot is missing or stale?

## Hard Stops

Do not approve without a follow-up ticket or explicit exception:

* Unbounded `findMany()` against transaction, ledger, log, movement, event, attachment, or task tables.
* Dashboard endpoint that aggregates raw transaction tables on every request.
* Detail endpoint that always loads all tabs.
* Loop that performs a database read/write per child row where child row count can exceed 100.
* Search endpoint without pagination.
* Query relying on `contains` against a high-cardinality text field without an index/search plan.

## Recommended Instrumentation

Near-term:

* Add structured endpoint timing logs at controller/service boundary.
* Record endpoint class, query count estimate, and payload size estimate in slow request logs.
* Track slow threshold at 1000 ms for cockpit endpoints and 500 ms for lookup endpoints.

Later:

* Add Prisma query logging in non-production diagnostic mode.
* Add read-model freshness timestamps to dashboard DTOs.
* Add background snapshot rebuild duration metrics.

## Baseline Risk Summary

High-risk read paths:

* Dashboard executive/control-tower aggregation when backed by live operational tables.
* `GET /projects/runtime` broad runtime aggregation.
* Inventory Material Detail movement/history calculations if transaction volume grows without tab-specific APIs.
* Runtime/integrity diagnostics that intentionally scan broad operational data.

Medium-risk read paths:

* Inventory return request cockpit.
* Project Detail tab endpoints until they stop relying on runtime source compatibility paths.
* Logistics dispatch dashboard once dispatch event volume grows.

Low-risk read paths:

* Bounded lookup endpoints.
* Dispatch detail by id.
* Master data endpoints with low cardinality.

