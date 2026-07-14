# QC Repository Boundary Audit

## Result

Status: **FAIL**

The controller is orchestration-only and uses Zod-validated DTOs. `QcRepository`
owns CRUD, list/count queries, activity-log persistence and transactions for QC
models. The service nevertheless injects `PrismaService` directly.

## Violations

| Path | Evidence | Impact |
| --- | --- | --- |
| Cockpit Production reads | `qc.service.ts:695` | Service directly reads Production Orders and nested stages/components. |
| Cockpit Components reads | `qc.service.ts:708` | Unbounded Component/Project relation data bypasses a repository/read model. |
| Cockpit Projects reads | `qc.service.ts:713` | Entire Project table is loaded into service memory. |
| Operational code generation | `qc.service.ts:1007` | `nextOperationalCode` receives Prisma directly from the service. |

## Transaction Boundary

QC model mutations and ActivityLog rows are generally inside
`QcRepository.transaction`. However:

- Domain events are emitted after repository commit.
- `logActivity` calls persistent audit emission while the repository transaction
  is still open, but that Outbox write does not use the same transaction client.
- Attachment linking calls `AttachmentsService` from inside the QC transaction,
  creating a cross-service transaction boundary.
- Workflow startup occurs after inspection commit; failure is swallowed and can
  leave an inspection without its requested workflow.

Repository completion must preserve these business semantics while moving all
Prisma access and atomic Outbox writes behind repository-owned transactions.

