# QC Workflow Audit

## Implemented Foundation

- Checklist and checklist-item CRUD foundation.
- Inspection creation, update, start, result entry and issue creation.
- Completion to `PASSED`, `FAILED` or `REWORK_REQUIRED`.
- Approve/reject endpoints.
- NCR creation and read list.
- Evidence relation models and ActivityLog rows.
- Production-to-Yard gate accepts linked inspection `PASSED` or `APPROVED`.

## Critical Gaps

| Gap | Evidence | Risk |
| --- | --- | --- |
| Generic status bypass | Create/update DTO accepts any `QcInspectionStatus`. | Clients can skip the intended lifecycle. |
| Approval guard missing | Approve updates any inspection directly. | Draft/failed/cancelled inspection can potentially become approved. |
| Rejection guard missing | Reject updates any inspection directly. | Terminal or unrelated states can be overwritten. |
| Quick-pass orchestration | Frontend suppresses start failure, then completes and approves in three requests. | Partial completion is possible. |
| NCR lifecycle incomplete | Only create/list endpoints exist. | Review, disposition, approval, closure and audit are not operable. |
| Rework/reinspection relation absent | `REWORK_REQUIRED` can be completed again, but no explicit reinspection chain exists. | Traceability across repair cycles is ambiguous. |
| Workflow start non-atomic | Workflow startup is post-commit and errors are swallowed. | Requested approval workflow may silently be absent. |
| Synthetic analytics | Trend dates/heights and calibration status are hardcoded in React. | Operators can mistake presentation data for real QC history. |

## Target Workflow for Decision

```text
Inspection READY -> IN_PROGRESS -> PASSED -> APPROVED -> RELEASE
                               \-> FAILED/REWORK_REQUIRED
                                   -> NCR
                                   -> disposition/corrective action
                                   -> rework
                                   -> linked re-inspection
                                   -> approval or rejection
```

The exact state machine, NCR disposition authority, reinspection identity and
Production/Yard release rule require a QC decision document before
implementation. EPIC150 changes none of these behaviors.

