# Core Platform Compliance Score

Date: 2026-07-08

Scope: EPIC111 Inventory + Production compliance audit.

## Score Summary

| Module | Compliance | Interpretation |
| --- | ---: | --- |
| Inventory | 72% | Operationally mature; platform foundation present; needs repository/event/read-model cleanup. |
| Production | 52% | Functional foundation exists; not yet enterprise MES-ready. |
| Average | 62% | Core platform exists, but module adoption is uneven. |

## Category Scores

| Category | Inventory | Production | Notes |
| --- | ---: | ---: | --- |
| Repository | 65% | 45% | Both have repositories, but direct Prisma remains common. Production has more service fragmentation. |
| Runtime Metrics | 85% | 80% | Global instrumentation covers both; module-specific Operations Center drill-down is missing. |
| Runtime Analytics | 75% | 65% | Endpoint/query ranking exists globally; workspace-specific scoring is not complete. |
| Snapshot Engine | 75% | 20% | Inventory dashboard is cut over snapshot-first; Production lacks first-class snapshots. |
| Background Engine | 45% | 30% | Infrastructure exists; most module workflows remain synchronous. |
| Event / Outbox | 45% | 35% | EventBus imports exist; canonical event contracts are incomplete. |
| Read Models | 65% | 35% | Inventory has dashboard read model; Production needs readiness/stage/cost snapshots. |
| Operations Center | 55% | 35% | Both visible globally; neither has rich module-specific health yet. |
| UX Standardization | 75% | 70% | Inventory is design master; Production visually aligned but some tabs are placeholders. |
| Business Workflow | 75% | 55% | Inventory workflows are broad; Production lacks deeper MES workflows. |
| Scalability | 70% | 45% | Inventory can scale with read models; Production needs event/snapshot/domain foundations. |

## Inventory Compliance Result

Inventory is ready for controlled growth, but not yet ready for 100M+ transaction history without read-model expansion.

Main reason for 72%:

- Strong operational workflow and snapshot-first dashboard.
- Partial repository adoption.
- Missing full event/outbox contract.
- Heavy Material Detail and transaction history reads need segmentation/read models.
- Background engine exists but is not widely used by Inventory side effects.

## Production Compliance Result

Production should not receive major new MES UI before domain/platform hardening.

Main reason for 52%:

- Production has many functional pieces.
- Repository adoption is partial.
- Snapshot/read-model adoption is weak.
- WorkOrder and ProductionOrder overlap.
- Critical MES concepts are missing or not canonical.
- Operations Center lacks Production-specific health.

## Readiness Decision

Inventory:

```text
Ready for targeted compliance refactor.
Do not add major Inventory features until repository/event/read-model cleanup begins.
```

Production:

```text
Not ready for major MES expansion.
First build Production domain + repository + snapshot/event foundations.
```

## Minimum Compliance Targets Before Next Major Feature Wave

| Module | Minimum Target | Required Work |
| --- | ---: | --- |
| Inventory | 82% | Repository command wrap, canonical events, Material Detail read models, Inventory Operations Center health. |
| Production | 70% | Domain cleanup, repository coverage, Production snapshots, event contracts, MES missing-domain plan. |

