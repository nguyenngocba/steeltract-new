# Production API Cutover Plan

Date: 2026-07-17

## Phase 1 - Available

- Keep all compatibility routes unchanged.
- Publish `/production/commands` for controlled backend/operator clients.
- Require JWT, `Idempotency-Key` and explicit aggregate versions.

## Phase 2 - Certification

- Exercise Create through Close, Work Orders, Completion, Scrap and Rework on
  disposable real records.
- Verify 409 behavior, duplicate replay, timeline, audit, canonical Outbox,
  snapshot projection and Operations Center.

## Phase 3 - Client Migration

- Add command version/idempotency support to a separately approved frontend
  integration sprint.
- Migrate one workflow at a time without changing presentation.
- Monitor legacy/new route usage and parity.

## Phase 4 - Legacy Retirement Decision

Retirement requires usage evidence, response parity and a separate breaking
API decision. EPIC188 does not remove or redirect legacy routes and does not
invent engineering/version data for old requests.
