# Multi-material Risk Assessment

Date: 2026-07-14  
Assessment: **MEDIUM, CONTROLLED BY PHASED ROLLOUT**

## Risk Register

| Risk | Severity | Control | Release gate |
|---|---|---|---|
| Duplicate submit after network timeout | High | No auto-retry; durable public idempotency follow-up | Required before broad rollout |
| Collective over-issue from duplicate lines | High | EPIC181 aggregate bucket validation | Automated and concurrency tests |
| Partial transaction | Critical | One API command and repository transaction | Forced invalid-line rollback test |
| Mixed units shown as one quantity | High | Group quantity by unit; weight only with conversion truth | UI binding test |
| Transfer source/destination ambiguity | High | One route per material; deterministic pair | Transfer pilot gate |
| Same material across different locations merged | High | Full bucket/business duplicate identity | Pending reducer tests |
| Lot/batch/serial silently lost | Critical | Feature explicitly unsupported; no remark encoding | Stop condition |
| Stale client stock preview | High | Server authoritative validation at commit | Concurrent issue test |
| Pending lost on close/navigation | Medium | Dirty-state confirmation and unload guard | Operator test |
| Large pending payload/operator error | Medium | Phase 1 cap of 50 entries | 1/5/20/50 tests |
| Adjustment evidence becomes header-only | High | Workflow rollout blocked until line evidence is approved | Adjustment gate |
| Stock Take semantics diluted into generic transaction | High | Existing count workflow remains authoritative | Stock Take gate |

## Failure Handling Matrix

| Failure | Server effect | Pending effect | Operator action |
|---|---|---|---|
| Local field validation | None | Retained | Correct focused field |
| Aggregate stock preview failure | None | Retained | Reduce/remove demand |
| Server validation line failure | Full rollback | Retained | Correct identified entry |
| Persistence/Outbox failure | Full rollback | Retained | Retry only after confirmed failure |
| Network timeout | Unknown until reconciled | Retained | Check transaction history; no auto-retry |
| Snapshot delay | Transaction committed | Cleared after API success | Workspace updates live; Dashboard may lag |

## Residual Decisions

### Durable Public Idempotency

The existing stable-reference protection does not cover ordinary operator
requests without a request key. A later sprint must approve an additive durable
key/unique constraint before automatic retry or weak-network certification.

### Multiple Transfer Routes for One Material

Phase 1 rejects this case. Supporting it requires a stable pair identifier or
line grouping contract; array position is not acceptable evidence.

### Tracking and Drafts

Lot/batch/serial and persistent transaction drafts are separate domains. They
must not be simulated in Pending metadata or browser persistence.

## Risk Acceptance

- Pending Items frontend foundation: acceptable now.
- Inbound controlled pilot: acceptable after frontend tests.
- Outbound/Transfer production rollout: conditional on real concurrency and
  operator tests.
- Adjustment/Stock Take/Return generic rollout: not approved by EPIC182.
