# QC Core Platform Foundation Audit

## Conclusion

Status: **FOUNDATION BLOCKED (approximately 31% Core Platform compliance)**

QC has a substantial domain schema, validated DTOs, repository-backed commands,
attachments, activity logs, inspection results, issues and NCR records. It does
not yet implement the Enterprise read/runtime path used by Inventory,
Production and Components.

| Foundation | Score | Finding |
| --- | ---: | --- |
| Repository boundary | 55% | Most QC persistence is repository-backed, but `QcService` still injects Prisma for Cockpit cross-domain reads and code generation. |
| ADR011 live read model | 30% | List APIs can paginate, but active workspaces all consume one capped Cockpit payload and filter/aggregate in React. |
| Persisted snapshot | 0% | No QC snapshot models, repository, reader, writer, validator or flag. |
| Runtime metrics | 10% | Generic HTTP metrics can classify QC; no QC snapshot/read-model counters exist. |
| Operations Center | 0% | No QC Platform Health block. |
| Event/Outbox | 35% | Some persistent events exist, but writes are outside the business transaction and no snapshot route consumes them. |
| Workflow integrity | 55% | Core inspection/result/NCR records exist; transition bypasses and NCR/rework gaps remain. |

## Current Runtime Data

Read-only database inspection on 2026-07-13 found 2 checklists and no
inspections, results, issues, NCRs, `qc.*` Outbox rows or `snapshot.qc.*` jobs.
This dataset cannot certify workflow behavior or performance.

## Recommended Sequence

1. EPIC151: complete repository and atomic transaction/Outbox boundaries.
2. EPIC152: split operator workspaces into bounded live read models under ADR011.
3. EPIC153: add reusable QC dashboard/inspection-summary snapshots.
4. EPIC154: add module metrics and Operations Center health.

