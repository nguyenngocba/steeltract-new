# Inventory UI Remediation Plan

This plan records remediation only. EPIC118 made no application changes.

## P0 - Data and Business Correctness

1. Replace the fabricated Overview `valueTrend` fallback with
   `CockpitEmptyState` or an explicit unavailable-data result.
2. Provide a canonical snapshot/read-model endpoint for the Overview and Materials
   workspaces, preserving the existing visible UI while removing transaction-based
   stock reconstruction.
3. Correct “Nhập kho hôm nay” and “Xuất kho hôm nay” values to use only today's
   transactions.
4. Derive transfer value from real transaction lines or mark it unavailable;
   remove the hard-coded zero.
5. Replace the Materials stocktake metric with actual stocktake-session data.
6. Replace “Chênh lệch tồn kho” with a true variance metric or rename it to the
   actual low/out-of-stock ratio.
7. Return pagination/completeness metadata so capped data can never be presented
   as an enterprise total.

Exit condition: all visible inventory totals reconcile with canonical location and
material snapshots for the same scope and time.

## P1 - Large-Data Performance

1. Add server-side material search, filter, sort, and cursor/page pagination.
2. Segment Overview KPIs/charts from the material list rather than polling the same
   broad audit payload.
3. Add server-side transaction and material-history pagination.
4. Scope transaction attachment queries by material and transaction identifiers.
5. Add query cancellation and explicit React Query cache/stale policies.
6. Replace latest-200 client trend reconstruction with a bounded backend trend
   read model.
7. Narrow the zones endpoint or split occupancy, stock, and item lookups.

Exit condition: payload size and query cost are bounded independently of total
material/transaction counts.

## P2 - UX and Stability

1. Distinguish loading, empty, partial, and error states.
2. State clearly when a KPI reflects active filters rather than the entire
   inventory.
3. Remove unstable random React keys.
4. Preserve previous page data during server pagination.
5. Review “show all” behavior and use virtualization or remove unbounded rendering.
6. Show slot and level consistently where location traceability matters.

## Recommended Sequence

One P0 remediation sprint is required before repeating the binding audit. P1 should
follow before any enterprise-volume readiness claim. P2 can be delivered after
correctness and bounded-query contracts are stable.

