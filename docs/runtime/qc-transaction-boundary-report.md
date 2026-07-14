# QC Transaction Boundary Report

## Repository-Owned Transactions

The existing command boundaries remain repository transactions:

- Checklist create/update.
- Inspection create/update/start/complete/approve/reject.
- Result recording.
- Issue create/update.
- NCR creation.

ActivityLog and the Outbox records produced by these commands now use the same
`QcTx`. A rollback therefore removes the QC mutation, ActivityLog and event
record together.

## Cross-Module Orchestration

Workflow startup after inspection creation and Attachment subsystem linking are
retained exactly as before. They are explicit cross-module orchestration and are
not presented as part of the QC database/Outbox atomic guarantee. Changing
their semantics requires a separately approved workflow/integration sprint.

EPIC151 does not move business validation or lifecycle decisions into a
repository.

