# EPIC160 - Yard Core Foundation Audit

## Conclusion

**Status: AUDIT COMPLETE, CORE PLATFORM BLOCKED (estimated 36%)**

Yard is more than CRUD: it has real zone/row/slot persistence, placement,
internal movement, removal, crane references, movement history, occupancy rules,
attachments and activity logs. It is not yet an enterprise Yard Management
System because the operational chain from QC release through reservation,
receiving, loading and dispatch is incomplete.

| Core capability | Assessment | Evidence |
| --- | ---: | --- |
| Repository boundary | 60% | `YardRepository` exists, but `YardService.removeItem` queries Component and ProductionOrder directly through the transaction client |
| Live read model / ADR011 | 30% | Repository list queries exist, but active UI requests unbounded zones/slots and performs workspace aggregation/filtering in React |
| Snapshot platform | 15% | `YardSnapshot` is manually generated JSON; no shared snapshot reader/writer/validator/rebuilder/feature flag |
| Runtime metrics | 10% | global HTTP/Prisma metrics apply, but there are no Yard hit/miss/age/lag/fallback/read-model counters |
| Operations Center | 0% | no Yard Platform Health section |
| Atomic event/outbox | 25% | events persist through EventBus, but domain events are emitted after business transaction commit |

## Required Roadmap

1. EPIC161: repository and atomic Outbox completion; define cross-module command ownership.
2. EPIC162: bounded Yard live read models and frontend data-binding cutover.
3. EPIC163: domain snapshot foundation for dashboard/layout analytics.
4. EPIC164: Yard runtime metrics and Operations Center integration.
5. Separate business sprint: reservation, QC receiving, hold/release, load plans/tasks and Logistics dispatch handoff.

No application code, schema, API, workflow, or data was changed by EPIC160.

