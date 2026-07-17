# Component Transition Matrix

Date: 2026-07-17  
Status: **APPROVED - ADS002**

## Component

| From | Command | To | Allowed |
| --- | --- | --- | --- |
| none | `CreateComponent` | `DRAFT` | Yes |
| `DRAFT` | first `ReleaseComponentRevision` | `ACTIVE` | Yes, atomic consequence |
| `ACTIVE` | `DeprecateComponent` | `DEPRECATED` | Yes |
| `DEPRECATED` | `ReactivateComponent` | `ACTIVE` | Yes, current release valid |
| `DRAFT` | `ArchiveComponent` | `ARCHIVED` | Yes, no released revision/reference |
| `DEPRECATED` | `ArchiveComponent` | `ARCHIVED` | Yes, no open obligation |
| `ACTIVE` | `ArchiveComponent` | `ARCHIVED` | No; deprecate first |
| `ARCHIVED` | any transition | any | No; terminal |

## Component Revision

| From | Command/fact | To | Allowed |
| --- | --- | --- | --- |
| none | `CreateComponentRevision` | `DRAFT` | Yes |
| `DRAFT` | `SubmitRevisionForReview` | `IN_REVIEW` | Yes, BOM validated |
| `IN_REVIEW` | `ReturnRevisionToDraft` | `DRAFT` | Yes |
| `IN_REVIEW` | `ApproveComponentRevision` | `APPROVED` | Yes |
| `APPROVED` | `WithdrawRevisionApproval` | `DRAFT` | Yes |
| `APPROVED` | `ReleaseComponentRevision` | `RELEASED` | Yes |
| `RELEASED` | newer revision released | `SUPERSEDED` | Yes, internal atomic transition |
| `RELEASED` | `WithdrawUnusedRelease` | `ARCHIVED` | Exceptional; zero downstream references |
| `DRAFT` | `ArchiveDraftRevision` | `ARCHIVED` | Yes, not referenced |
| `SUPERSEDED` | `ArchiveSupersededRevision` | `ARCHIVED` | Yes, retention policy |
| `RELEASED` | edit/approve/return | any | No |
| `SUPERSEDED` | edit/release | any | No |
| `ARCHIVED` | any transition | any | No; terminal |

## Engineering BOM Definition

| From | Command/fact | To | Allowed |
| --- | --- | --- | --- |
| none | create parent revision | `DRAFT` | Yes |
| `DRAFT` | `ReplaceEngineeringBomContent` | `DRAFT` | Yes |
| `DRAFT` | `ValidateEngineeringBom` | `VALIDATED` | Yes |
| `VALIDATED` | approved content edit | `DRAFT` | Yes; validation invalidated |
| `VALIDATED` | parent revision released | `RELEASED` | Yes |
| `RELEASED` | replacement revision released | `SUPERSEDED` | Yes |
| `SUPERSEDED` | parent revision archived | `ARCHIVED` | Yes |
| `RELEASED` | direct edit | any | No |
| any | standalone BOM release | any | No |

## Explicitly Invalid Cross-domain Transitions

The following facts never transition Component or Revision state directly:

- Production `CUTTING`, `WELDING`, `PAINTING` or completion.
- QC pass/fail/NCR.
- Inventory stock/location changes.
- Yard allocation or movement.
- Logistics shipped/delivered.
- Project installed/accepted.

They update owner projections only.

