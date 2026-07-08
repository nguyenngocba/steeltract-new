# Dashboard API Performance Audit

Date: 2026-07-07

Scope: Sprint PERF.1. This audit reviews Dashboard API endpoints and identifies endpoints that read operational transaction tables directly.

## Endpoint Matrix

| Endpoint | Direct transaction sources before PERF.2 | Risk | Notes |
| --- | --- | --- | --- |
| `GET /dashboard/executive-cockpit` | Indirect Inventory transaction/location reads through metrics, notification, activity, and insight services | High | Executive cockpit aggregates multiple modules in one request. Inventory sub-queries were the highest risk path. |
| `GET /dashboard/cockpit` | `inventory_transactions`, `inventory_transaction_items`, `inventory_items`, `inventory_location_stocks` | High | Main dashboard cockpit was mixing live dashboard response creation with Inventory aggregation. |
| `GET /dashboard/stats` | Inventory item count, transaction count, low-stock scan | Medium | Counts are simple today, but row growth would make low-stock scans expensive. |
| `GET /dashboard/recent-transactions` | `inventory_transactions` with item include | Medium | Bounded by `take`, but still directly coupled to the transactional table. |
| `GET /dashboard/low-stock` | `inventory_items` plus stock/location interpretation | Medium | Low-stock logic should not be recomputed in every dashboard call. |
| `GET /dashboard/procurement` | Inventory low-stock item scan | Medium | Procurement suggestions were recomputed from live Inventory data. |
| `GET /dashboard/anomalies` | Inventory stock threshold scan | Medium | Similar risk to low-stock/procurement paths. |
| `GET /dashboard/construction-progress` | Components/project progress counts | Medium | Not Inventory transaction heavy, but can become expensive with component growth. |
| `GET /dashboard/analytics` | Component status/value aggregation | Medium | Reads component sets for chart aggregation. |
| `GET /dashboard/forecast` | Component/project forecast-style counts | Low-Medium | Current queries are bounded by existing module volumes. |
| `GET /dashboard/costs` | Component costing/project links | Medium-High | Cost views can become heavy when component costing history grows. |
| `GET /dashboard/activities` | `activity_logs` | Low-Medium | Uses bounded recent activity reads. |

## Direct Inventory Query Hotspots

Files audited:

* `apps/backend-api/src/modules/dashboard/dashboard.controller.ts`
* `apps/backend-api/src/modules/dashboard/dashboard-metrics.service.ts`
* `apps/backend-api/src/modules/dashboard/dashboard-activity.service.ts`
* `apps/backend-api/src/modules/dashboard/dashboard-notification.service.ts`
* `apps/backend-api/src/modules/dashboard/dashboard-insight.service.ts`

High-risk patterns found:

* Repeated reads of `inventory_transactions` and `inventory_transaction_items` for dashboard movement, recent transaction, and forecast views.
* Repeated reads of `inventory_location_stocks` to recompute stock by item for dashboard health and production stop risk.
* Repeated scans of `inventory_items` to classify low/out-of-stock materials.

## PERF.1 Conclusion

Dashboard Inventory aggregation was the immediate bottleneck candidate because several endpoints independently recomputed the same stock, low-stock, movement, and forecast inputs. Production, Projects, Yard, QC, and Costing still need later read-model passes, but Inventory was correctly selected as the first PERF.2 target.

