# Inventory Idempotency Report

Date: 2026-07-14  
Status: **FOUNDATION COMPLETE; PUBLIC KEY DEFERRED**

## Implemented

When both `referenceModule` and `referenceId` are supplied, the canonical
Inventory command checks for an existing transaction with the same:

`type + referenceModule + referenceId`

The check runs inside the repository-owned Serializable transaction. Existing
transactions are returned before number generation, stock mutation, line
creation or Outbox creation. Serializable conflicts (`P2034`) use the existing
bounded three-attempt transaction retry policy. A focused test confirms a
duplicate stable reference performs no second write.

This provides an idempotency foundation for internal workflows such as Project
Return and other callers that already own stable references, without changing
the public API.

## Not Claimed

Operator requests that omit both reference fields have no durable client request
key. In-memory deduplication, payload hashing without ownership, or a time-window
query would be unsafe and was not introduced.

Full public request idempotency requires separate approval for one of:

1. an additive `Idempotency-Key` contract backed by durable unique storage; or
2. an additive request-id field and unique database constraint.

That work necessarily affects API and/or schema and is outside EPIC181.

## Atomicity

Existing transaction, lines, balances and Outbox still share one repository
transaction. EPIC181 did not change Atomic Outbox or Snapshot Engine behavior.
