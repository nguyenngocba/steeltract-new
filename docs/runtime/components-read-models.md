# Components Projection Read Models

| Projection | Source events | Purpose |
| --- | --- | --- |
| `ComponentSummary` | component identity lifecycle | Latest component facts |
| `CurrentReleasedRevision` | `component.revision.released` | Current release catalog source |
| `RevisionHistory` | `component.revision.*` | Append-only revision history |
| `EngineeringBOMView` | `component.bom.definition.*` | Released engineering definition facts |
| `ReleaseTimeline` | release and supersede events | Release history |

Reducers follow AD-016 and AD-019 event names. They do not modify Components
aggregate state and do not introduce lifecycle transitions. Existing Components
workspace/read-model endpoints are unchanged until an explicit UI/API cutover.
