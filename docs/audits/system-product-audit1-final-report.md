# SYSTEM.PRODUCT.AUDIT.1 - Final Report

Audit date: 2026-08-14  
Final classification: **SIGNIFICANT GAPS**

## Direct answers

1. **Is the structure correct?** Partially. The canonical physical workflow is
   present, but active legacy Component-based read paths and parallel command
   surfaces remain.
2. **What data is dirty?** Most business data is retained SYSTEM/STABILITY/E2E/
   CERT regression data; several master names are duplicated semantically.
3. **What should be retained?** Migration ledger, permissions, approved roles,
   required users/settings, canonical master data and projection metadata.
4. **What can be cleaned later?** Dependency-complete fixture business graphs,
   fixture personas and duplicate fixture master rows after backup/approval.
5. **Which UI is incomplete?** Procurement is a hardcoded prototype; Suppliers
   contains synthetic operational sub-tabs.
6. **Which UI is inconsistent?** Procurement design, mixed English/Vietnamese
   terminology, compressed headers/KPI at 1366px, emoji and giant page files.
7. **Which dashboards are fake/legacy?** Procurement and Supplier sub-tabs are
   fake; Project/Component/legacy Dashboard metrics remain legacy-derived.
8. **Which APIs are old/wrong?** Component deliver/install, legacy Production
   mutations and several `/dashboard/*` endpoints conflict with canonical
   physical semantics.
9. **Which modules are not fully canonical?** Components read models, Projects
   summary, Executive metric filtering, Procurement frontend and Suppliers
   operational views.
10. **How much work remains?** 8 P0 closure items, 9 P1 quality items and 5 P2
    debt items identified below.

## Scores

| Category | Score |
|---|---:|
| Architecture | 79/100 |
| Canonical Domain | 68/100 |
| Data Integrity | 75/100 |
| Master Data | 78/100 |
| RBAC | 84/100 |
| UI Consistency | 78/100 |
| UX Usability | 73/100 |
| Dashboard Truth | 58/100 |
| Legacy Debt | 55/100 |
| **Overall (unweighted average)** | **72/100** |

Rating: **70-79 - Significant gaps**.

## What is already strong

- Inventory conservation passed: zero negative balances and zero mismatches
  across item cache, location stock and signed ledger.
- ComponentInstance lineage is complete for all 56 physical instances.
- Procurement backend canonical FKs and 39 receipt transactions are valid.
- All 13 Component dispatch lines reference physical ComponentInstances.
- Projection checkpoints are 25/25 HEALTHY with zero recorded failures.
- Historical latest returned authoritative/fresh/parity=true data.
- RBAC has shared sidebar, route, action and API layers with 93 permissions.
- Browser stability passed 68/68 route/viewports with no runtime errors or
  document-level overflow.

## P0 before SteelTrack V1 product completion

1. Replace hardcoded Procurement route with the canonical Procurement API.
2. Remove synthetic Supplier quotes/PO/delivery/payables/log/report data from
   active UI; use real contracts or empty states.
3. Convert Project execution/KPI/snapshot metrics from `Component.status` to
   requirements + ComponentInstance + Logistics lineage.
4. Convert Components overview/report/dashboard/snapshot physical metrics to
   ComponentInstance and Finished Goods eligibility.
5. Remove active frontend use of Component definition deliver/install and
   close the legacy endpoint exposure after compatibility inventory.
6. Canonicalize or retire legacy `/dashboard/*` metrics.
7. Make Executive filters and KPI labels match their actual data scope.
8. Align standalone QC, Executive QC and snapshot metric definitions around an
   explicit physical-state versus inspection-event contract.

## P1 production-quality closure

1. Approve and execute a fixture cleanup plan; do not delete ad hoc.
2. Resolve duplicate UOM/category/type fixture master names.
3. Repair missing Components/Yard snapshots and stale Logistics/Dispatch
   snapshots.
4. Define the Yard `remainingQuantity` invariant.
5. Capture actor identity for non-system business ActivityLog events.
6. Add authoritative dependency checks beyond Warehouse and paginate generic
   master-data lists.
7. Deprecate parallel Production command routes and remove proven dead
   controller files.
8. Fix 1366px header/KPI truncation, terminology, emoji and status mappings.
9. Split giant Production/Suppliers/Projects/Dashboard pages by existing domain
   boundaries and complete keyboard/WCAG certification.

## P2 debt

1. Consolidate advanced/platform routes that are not part of the approved ERP
   module surface.
2. Standardize server-driven saved filters across modules.
3. Add a governed metric catalog and lineage UI for executives.
4. Add semantic duplicate detection for master names, not only unique codes.
5. Add automated visual regression baselines for the four audited viewports.

## Release recommendation

**SteelTrack is not yet a complete V1 product from a structure/data/UI/domain
truth perspective.** The canonical operational core is usable and substantially
stronger than the score suggests, but polished fake screens and legacy physical
metrics are unacceptable because users cannot distinguish them from real data.

Recommended order:

```text
Procurement/Supplier truth
  -> Component/Project physical metric convergence
  -> Executive metric/filter contract
  -> controlled fixture cleanup
  -> snapshot parity
  -> desktop UX/accessibility polish
```

No source, schema, migration or business data was changed during this audit.
No file was staged or committed.
