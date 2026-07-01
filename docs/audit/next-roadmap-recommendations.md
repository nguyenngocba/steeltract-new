# Next Roadmap Recommendations

Date: 2026-06-29

## Strategic Direction

SteelTrack should not add more visible cockpit screens before hardening the operational substrate. The next phase should focus on enterprise-grade data correctness, workflow orchestration, cost traceability, and import/realtime foundations.

## Phase 1 - Stabilize Enterprise Foundations

Goal: make the current system safe to scale.

Recommended sprints:

1. Workflow Engine Binding P0
   - Bind WorkflowInstance to Inventory Adjustment, Production Material Issue/Return, and QC NCR/CAPA.
   - Add approval assignment and audit trail.

2. Inventory Ledger & Import Readiness
   - Define immutable slot-level ledger.
   - Create rebuild checks for `InventoryTransactionItem -> InventoryLocationStock -> InventoryItem.quantity`.
   - Create historical import dry-run validator.

3. Costing Source Integrity
   - Validate real transaction valuation across Inventory/Production.
   - Add costing source trace API and UI.
   - Mark average-cost fallbacks explicitly.

## Phase 2 - Expand Operational Control

Goal: make weaker business domains real.

Recommended sprints:

1. Project Cost Control
   - Project budgets, planned vs actual material cost, component rollup.

2. Supplier/Purchasing Workflow
   - Quotes, PO approvals, receiving exceptions, supplier quality.

3. QC CAPA & Evidence Workflow
   - CAPA lifecycle, evidence attachments, inspector assignments, NCR closure discipline.

## Phase 3 - Realtime & Scale

Goal: make the cockpit live and scalable.

Recommended sprints:

1. Realtime Event Contract
   - Inventory/Yard/Production/QC domain events.
   - Frontend socket invalidation.
   - Polling reduction.

2. Dashboard Read Models
   - Persist daily movement, production readiness, Yard occupancy, QC trend, and cost summaries.

3. Logistics Foundation
   - Delivery trips, dispatch plans, vehicle assignments, shipment documents, proof of delivery.

## If Only 3 Next Sprints Are Allowed

1. Workflow Engine Binding P0

Why:

- SteelTrack already has the workflow models.
- Approvals and assignments are the main blocker before enterprise governance.
- Inventory Adjustment, Production Issue/Return, and QC NCR are high-value and high-risk flows.

2. Inventory Ledger & Historical Import Readiness

Why:

- Importing historical data without replay/rebuild rules can corrupt stock.
- Inventory remains the base truth for Production, Costing, Dashboard, Projects, and Purchasing.
- This reduces the largest enterprise risk before real deployment.

3. Component/Project Cost Traceability

Why:

- Material costing foundation exists now.
- Management will need cost answers before broader rollout.
- It turns current read-only Costing Engine into operator-trustworthy analysis.

## Do Later

- Deeper Shopfloor/MES runtime dashboards.
- Full Logistics cockpit.
- Dashboard personalization.
- Advanced Yard 3D coordinates.

Those are valuable, but only after workflow, import, and costing correctness are stronger.

