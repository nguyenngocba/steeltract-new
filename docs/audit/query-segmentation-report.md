# Query Segmentation Report

Date: 2026-07-07

Scope: Sprint PERF.4.

## Projects Detail

Before:

* `GET /projects/:id/detail/:tab` called `runtimeDashboard()`.
* Backend loaded the full Projects runtime payload, then sliced arrays by `projectId`.

After:

* `GET /projects/:id/detail/:tab` calls `ProjectsRepository.findProjectDetailSources(projectId, tab)`.
* Each tab requests only the source groups it needs.

Tab source groups:

* `overview`: project, components, inventory transactions, production orders, WBS, returns, documents, logs.
* `materials`: project, project inventory transactions, project tasks, return requests.
* `components`: project, project components.
* `progress`: project, WBS and legacy component tasks.
* `command`: project, components, material transactions, production orders, WBS, returns, documents, logs.
* `site`: project, WBS, documents, logs.
* `costs`: project, components, material transactions, WBS.
* `documents`: project documents.
* `logs`: project logs, WBS, return requests.

Frontend:

* Existing route/UI unchanged.
* React Query key remains tab-scoped: `['project-detail-tab', projectId, tab]`.

## Inventory Detail

Current segmentation:

* Core material detail payload remains compatible.
* Material attachment query only runs for `overview`, `images`, and `documents`.
* Transaction attachment query only runs for `transactions`, `documents`, `logs`, `projects`, and `suppliers`.

Future segmentation:

* Split `GET /inventory/items/:id/detail` into tab-specific endpoints for movement history, location balances, analytics, project usage, and supplier usage if payload size becomes a bottleneck.

## Logistics Detail

Current segmentation:

* Dispatch list and dashboard remain separate.
* Dispatch detail drawer fetches `GET /logistics/dispatch-orders/:id` lazily and caches by `['logistics-dispatch-detail', orderId]`.

Future segmentation:

* Split dispatch timeline, photos, loading checklist, and receive reconciliation history if dispatch documents grow.

