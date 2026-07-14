# QC Repository Foundation Report

## Result

Status: **APPROVED**

EPIC151 completes the QC persistence boundary without changing API contracts,
workflow transitions or business rules.

```text
QcController
  -> QcService
     -> QcRepository / QcCockpitRepository
        -> Prisma
```

`QcService` no longer imports or injects `PrismaService`. Operational code
generation is delegated to `QcRepository`; the existing Cockpit Production,
Component and Project queries are delegated unchanged to
`QcCockpitRepository`. Business aggregation remains in the service pending the
separate ADR011 read-model sprint.

The NCR code generator now addresses Prisma's actual
`nonConformanceReport` client property; the previous service used the invalid
`ncr` property name. The generated `NCR-*` format and API behavior are unchanged.

## Coverage

| Area | Repository owner | Status |
| --- | --- | --- |
| Checklist | `QcRepository` | PASS |
| Inspection | `QcRepository` | PASS |
| Result | `QcRepository` | PASS |
| Issue | `QcRepository` | PASS |
| NCR | `QcRepository` | PASS |
| QC attachments and ActivityLog | `QcRepository` | PASS |
| Operational codes | `QcRepository` | PASS |
| Cockpit source queries | `QcCockpitRepository` | PASS |
| QC Outbox rows | `QcRepository` | PASS |

Static search under `apps/backend-api/src/modules/qc/services` returns no
`PrismaService` or `this.prisma` references.
