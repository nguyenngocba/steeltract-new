# Workflow Readiness Report

Date: 2026-06-29

## Current Workflow Foundation

SteelTrack already has workflow engine models:

- `WorkflowDefinition`
- `WorkflowStep`
- `WorkflowInstance`
- `WorkflowAction`

It also has related operational/audit models:

- `Approval`
- `ActivityLog`
- `Notification`
- `OutboxEvent`
- `BackgroundJob`

This is enough to build an enterprise workflow engine, but the engine is not yet consistently connected to module actions.

## Module Readiness

| Module | State Coverage | Approval Process | Assignments | Notifications | Audit Trail | Score |
|---|---:|---:|---:|---:|---:|---:|
| Inventory | Strong | Partial | Weak | Partial | Strong | Partial |
| Production | Strong | Partial | Partial | Partial | Strong | Partial |
| Projects | Partial | Weak | Weak | Partial | Partial | Partial |
| Suppliers | Partial | Weak | Weak | Weak | Partial | Not Ready |
| QC | Strong | Partial | Partial | Partial | Strong | Partial |

## Inventory

Ready:

- Transaction document state exists through transaction types and return workflow statuses.
- Inventory changes create transaction rows and transaction items.
- Adjustment, inbound, outbound, transfer, stocktake, return are visible workflows.

Gaps:

- Approval policies are not consistently bound to `WorkflowInstance`.
- Stocktake/adjustment approval is UI/process-light.
- Slot-level stock ledger rebuild is not formalized.

Workflow readiness: Partial.

## Production

Ready:

- Production order statuses.
- Reservation statuses and reservation line statuses.
- Material ledger events.
- Issue/return/consume workflow.
- Production logs and tasks.

Gaps:

- Material issue/return approval documents are not first-class.
- Shopfloor stage transitions are not canonical immutable history.
- Assignments exist through tasks, but cockpit workflows do not enforce them consistently.

Workflow readiness: Partial.

## Projects

Ready:

- Project statuses.
- Component delivery/install lifecycle.
- Project runtime views.

Gaps:

- Milestones, contracts, budgets, approval gates, project documents are incomplete.
- Project change orders are missing.

Workflow readiness: Partial.

## Suppliers

Ready:

- Supplier master records.
- Purchase orders exist.
- Supplier score/evaluation foundation exists.

Gaps:

- Supplier qualification, quote comparison, purchase approvals, receiving exceptions, payable workflow are incomplete.

Workflow readiness: Not Ready.

## QC

Ready:

- QC inspections.
- Checklist/result/issue/NCR entities.
- Start/complete/approve/reject APIs.

Gaps:

- CAPA is not a first-class lifecycle.
- Inspector assignment and evidence workflow are partial.
- Calibration exists only as placeholder/UI legacy route.

Workflow readiness: Partial.

## Workflow Engine Rollout Recommendation

Do not start with a generic workflow UI first. Start by binding workflow engine to three high-value module processes:

1. Inventory Adjustment approval.
2. Production Material Issue/Return approval.
3. QC NCR/CAPA lifecycle.

After those are stable, extend to Purchase Orders and Project Change Orders.

