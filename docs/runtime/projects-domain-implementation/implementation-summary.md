# RFC008 Projects Domain Implementation Summary

Date: 2026-07-17  
Status: IMPLEMENTED

## Implemented

- Added internal Project and ProjectTask aggregate boundaries using the existing
  `Project` and hierarchical `ProjectTask` models. Top-level tasks represent
  phases; child tasks represent execution tasks.
- Added project creation/activation, phase/task creation, task lifecycle,
  material allocation, delivery tracking, site receipt, acceptance, completion,
  and cancellation commands.
- Enforced unique material allocation per task/material, ordered Logistics
  delivery facts, one site receipt per shipment, unique acceptance identities,
  accepted evidence and terminal tasks before completion, optimistic concurrency, and
  durable idempotent replay.
- Persisted Project mutation, allocation/receipt records, ActivityLog, audit
  command receipt, and canonical Domain Outbox atomically in a Serializable
  repository transaction.
- Published only AD-019 events: `project.material.allocated` and
  `project.acceptance.completed`, with V1 envelopes and approved ordering keys.
- Did not modify Inventory balances, Production, Yard, Logistics shipments,
  Components, QC, frontend, public routes, or Projection Engine.

## Persistence And Compatibility

Material allocation uses `ProjectTaskMaterialAllocation`. Delivery and site
receipt identities use durable internal Outbox markers because the approved
schema has no separate receipt table. Project acceptance is the authoritative
canonical Outbox fact. Concurrency uses the persisted `updatedAt` token. No
schema change or migration was required, and existing Projects APIs remain
unchanged as compatibility paths.

## Verification

- Projects domain/command tests: PASS (9/9).
- Projects plus Enterprise Projection tests: PASS (14/14).
- Prisma validate: PASS; migration: NOT REQUIRED (schema unchanged).
- Backend build: PASS.
- Frontend build: PASS.
- `git diff --check`: PASS.
- Staged files and commits: none created.
