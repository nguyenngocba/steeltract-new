# QC Workflow Review

Date: 2026-07-18

Status: IMPLEMENTED - VISUAL QA PENDING

## Existing Workflow Used

The UI continues to use existing QC operations:

- Create inspection from completed Production queue row.
- Start inspection.
- Complete as passed.
- Complete as rework/NCR required.
- Approve passed inspection.

No new backend command or workflow state was introduced.

## Operator Flow

1. Open QC overview.
2. Review KPI and alert band.
3. Open Top inspection queue or MO waiting queue.
4. Inspect row details without leaving the workspace.
5. Execute existing QC action where allowed.
6. Use full workspace tabs for larger list review.

## Guardrails

- The dashboard does not infer unavailable inspector priority.
- The dashboard does not invent attachment, calibration or evidence records.
- Full inspection entry and evidence upload remain outside this sprint until
  authoritative backend contracts exist.

## Validation Needed

Browser-based operator validation should confirm:

- alerts are visible without scrolling on common desktop breakpoints;
- `Xem tất cả` navigation lands on the expected tabs;
- the top table, queue panel and detail dialogs remain usable on tablet widths;
- no legacy placeholder data is shown as operational truth.

