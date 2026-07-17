# Component Command API Rollout

Date: 2026-07-17  
Status: **IMPLEMENTED - ADDITIVE**

All routes require JWT and `Idempotency-Key`. Optional `X-Correlation-Id` and
`X-Causation-Id` are propagated into the AD-019 event envelope.

| Method and path | Command |
| --- | --- |
| `POST /components/commands` | Create Component |
| `POST /components/commands/:componentId/revisions` | Create Revision |
| `POST /components/commands/:componentId/revisions/:revisionId/bom/replace` | Replace Engineering BOM |
| `POST /components/commands/:componentId/revisions/:revisionId/bom/validate` | Validate Engineering BOM |
| `POST /components/commands/:componentId/revisions/:revisionId/submit-review` | Submit Revision Review |
| `POST /components/commands/:componentId/revisions/:revisionId/approve` | Approve Revision |
| `POST /components/commands/:componentId/revisions/:revisionId/release` | Release Revision and BOM atomically |
| `POST /components/commands/:componentId/deprecate` | Deprecate Component |
| `POST /components/commands/:componentId/archive` | Archive Component after owner clearance |

Create Component has no `expectedVersion` because the aggregate does not yet
exist. Create Revision locks the parent Component. Revision/BOM transitions
lock their respective aggregate versions; Release locks both Revision and
Component and updates the BOM in the same repository transaction.

For BOM replacement, `contentHash` is the lowercase SHA-256 hexadecimal digest
of canonical JSON `{ lines, routing }`: object keys are recursively sorted,
while array order is preserved. The server recalculates this hash and rejects a
mismatch before changing Revision or BOM state.

The canonical review event is
`component.revision.review.submitted`. The shorter
`component.review.submitted` alias is not emitted because AD-019 forbids a
second name for the same fact.
