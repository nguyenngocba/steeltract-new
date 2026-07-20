# QC Business Cockpit

Date: 2026-07-18

Status: IMPLEMENTED - VISUAL QA PENDING

## Business Questions Covered

Within the overview, a QA Manager or QC Inspector can identify:

- Pending inspections.
- In-progress inspections.
- Passed/failed inspection counts for today when dated rows are available.
- Open NCR volume.
- Completed manufacturing orders waiting for QC.
- Components or orders requiring attention.

## Quality Alerts

The alert band is derived from existing rows only:

- `READY`
- `IN_PROGRESS`
- `FAILED`
- `REWORK_REQUIRED`
- failed results
- rows with issues or NCRs
- production queue rows not yet approved by QC

No synthetic alerts or mock priorities were introduced.

## Top-N Rule

Dashboard cards show short working sets:

- Top 10 inspection rows.
- Top 5 production queue rows.
- Top 5 attention rows.

Full-list operation remains in the dedicated QC workspace tabs.

## Right-Side Decision Panel

The right column is reserved for immediate decisions:

- MO completed and waiting for QC.
- Latest inspection summary.
- Direct create/approve actions where existing commands already support them.

This keeps the main table dominant while preventing the empty dashboard-card
feeling seen in earlier module drafts.

