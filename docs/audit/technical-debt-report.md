# Technical Debt Report

Date: 2026-06-29

## P0 Technical Debt

1. Historical import is not safe yet.
   - Need import/replay/rebuild tooling before importing real historical operations.

2. Inventory immutable slot-level ledger is missing.
   - `inventory_location_stocks` is the current balance source of truth, but a rebuildable slot ledger is still needed.

3. Workflow engine is not bound to core module workflows.
   - Models exist, but Inventory/Production/QC/Suppliers/Projects do not consistently create WorkflowInstances.

4. Realtime is incomplete.
   - Gateways exist, but modules mostly poll.

## P1 Technical Debt

1. Two active navigation configs are not fully aligned.
   - `app/shell/sidebar/navigation.config.ts`
   - `app/config/navigation.config.ts`

2. Logistics is route-ready but backend-empty.
   - Current page uses static shipment rows and local charts.

3. Costing is material-only in practice.
   - Labor, machine, overhead, QC rework, Yard handling, and logistics cost need models/rules.

4. Projects/Suppliers/QC design system lag.
   - Inventory/Components/Production/Yard/Dashboard use cockpit primitives; Projects/Suppliers/QC still mix older module styles.

5. Dashboard action outputs are read-only.
   - Suggested actions do not yet create tasks, workflows, purchase requests, or notifications requiring acknowledgement.

## P2 Technical Debt

1. Archived/legacy frontend modules remain searchable and can confuse code discovery.
2. Some route tabs intentionally point to placeholder pages but are not visually labeled as implementation placeholders.
3. Component detail lacks a durable `/components/:id` route.
4. Production shopfloor stage mapping still has fallback logic when canonical stage history is absent.
5. Frontend-heavy analytics exist in several module pages.

## P3 Technical Debt

1. Dashboard preferences and saved layouts missing.
2. Cross-module report builder missing.
3. 3D Yard needs backend physical coordinate metadata for full runtime fidelity.
4. Realtime TV/shopfloor mode needs production-grade event tuning.

## Cleanup Recommendations

Do not begin with broad refactors. Clean debt by dependency order:

1. Formalize data invariants and import/rebuild commands.
2. Bind Workflow Engine to three high-value workflows.
3. Convert polling hotspots to event-driven invalidation.
4. Add read models for dashboard/costing.
5. Roll design system to Projects/Suppliers/QC/Logistics.

