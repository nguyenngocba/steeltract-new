# Component Event Contract

Date: 2026-07-17  
Status: **DOMAIN FACTS APPROVED - ENVELOPE/VERSIONING DEFERRED TO ADS004**

## Publishing Rule

Components publishes only facts it owns. Production stage, QC result, Yard
placement, shipment and installation events remain published by their owners.
All events below are written atomically to the shared Outbox with the aggregate
mutation.

## Canonical Component Facts

| Event | Produced by | Minimum fact payload |
| --- | --- | --- |
| `component.created` | `CreateComponent` | `componentId`, `code`, `state`, `aggregateVersion` |
| `component.metadata.updated` | `UpdateComponentMetadata` | `componentId`, `changedFields`, `aggregateVersion` |
| `component.deprecated` | `DeprecateComponent` | `componentId`, `reason`, `aggregateVersion` |
| `component.reactivated` | `ReactivateComponent` | `componentId`, `currentRevisionId`, `aggregateVersion` |
| `component.archived` | `ArchiveComponent` | `componentId`, `reason`, `aggregateVersion` |

## Canonical Revision Facts

| Event | Produced by | Minimum fact payload |
| --- | --- | --- |
| `component.revision.created` | `CreateComponentRevision` | `componentId`, `revisionId`, `revisionNo`, `baseRevisionId`, `aggregateVersion` |
| `component.revision.content.updated` | `UpdateRevisionContent` | `componentId`, `revisionId`, `changedSections`, `aggregateVersion` |
| `component.revision.review.submitted` | `SubmitRevisionForReview` | `componentId`, `revisionId`, `aggregateVersion` |
| `component.revision.review.returned` | `ReturnRevisionToDraft` | `componentId`, `revisionId`, `reason`, `aggregateVersion` |
| `component.revision.approved` | `ApproveComponentRevision` | `componentId`, `revisionId`, `approvedBy`, `aggregateVersion` |
| `component.revision.approval.withdrawn` | `WithdrawRevisionApproval` | `componentId`, `revisionId`, `reason`, `aggregateVersion` |
| `component.revision.released` | `ReleaseComponentRevision` | `componentId`, `revisionId`, `revisionNo`, `bomDefinitionId`, `previousRevisionId`, `aggregateVersion` |
| `component.revision.superseded` | New revision release | `componentId`, `revisionId`, `supersededByRevisionId`, `aggregateVersion` |
| `component.revision.archived` | Revision archive/unused withdrawal | `componentId`, `revisionId`, `reason`, `aggregateVersion` |

## Canonical BOM Facts

| Event | Produced by | Minimum fact payload |
| --- | --- | --- |
| `component.bom.definition.updated` | `ReplaceEngineeringBomContent` | `componentId`, `revisionId`, `bomDefinitionId`, `contentHash`, `aggregateVersion` |
| `component.bom.definition.validated` | `ValidateEngineeringBom` | `componentId`, `revisionId`, `bomDefinitionId`, `contentHash`, `aggregateVersion` |
| `component.bom.definition.invalidated` | Content edit after validation | `componentId`, `revisionId`, `bomDefinitionId`, `aggregateVersion` |

`component.revision.released` is the sole release fact. A duplicate
`component.release.published` event is forbidden because it would describe the
same business fact twice.

## Consumer Guidance

- Production consumes only `component.revision.released` and stores the exact
  revision/BOM reference used to create manufacturing data.
- Projects may consume released/deprecated/archive facts for planning choices.
- QC, Yard and Logistics consume identity/revision facts only when required;
  they continue publishing their own operational facts.
- Components read projections may subscribe to foreign facts but must not
  republish them as Component-owned events.

ADS004 must finalize envelope, schema version, correlation/causation fields,
subscriber matrix, replay policy and compatibility guarantees.

