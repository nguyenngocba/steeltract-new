# Legacy Documentation Audit

Audit date: 2026-06-11

Scope:

- `docs/api`
- `docs/architecture`
- `docs/backend`
- `docs/database`
- `docs/frontend`
- `docs/inventory`
- `docs/issues`
- `docs/modules`
- `docs/roadmap`
- `docs/setup`
- `docs/AI_CONTEXT.md`
- `docs/AI_RULES.md`
- `docs/KNOWN_ISSUES.md`
- `docs/PROJECT_OVERVIEW.md`
- `docs/ROADMAP.md`
- `docs/TREE_STRUCTURE.md`

No files were deleted or archived during this audit.

## Summary

Superseded by `docs/ai-state`:

- Most project status, roadmap, workflow, module-state, and high-level architecture notes now live in `docs/ai-state/CURRENT_STATE.md`, `PROJECT_STATUS.md`, `NEXT_TASKS.md`, `CURRENT_MODULES.md`, `CODEX_WORKFLOW.md`, and `decisions/*.md`.
- Legacy root docs still contain useful broad rules, but several are stale compared with current Nest/Prisma/TanStack Query implementation details and normalized ai-state docs.

Still unique:

- `docs/architecture/EVENT_NAMING.md` contains a concise event naming standard not fully captured in ai-state.
- `docs/architecture/ARCHITECTURE_FREEZE.md` contains explicit deprecated runtime names and strict architecture freeze rules.
- `docs/architecture/INVENTORY_TRANSACTION_RULES.md` contains a compact stock mutation rule set useful as a canonical reference.
- `docs/inventory/inventory-phase1-migration-plan.md` preserves rollout history and migration reasoning for transaction-first Inventory.
- `docs/TREE_STRUCTURE.md` contains module/folder structure guidance, although parts are stale.

Should be merged into ai-state:

- Event naming standards should be merged into `docs/ai-state/decisions/architecture-decisions.md` or a new `docs/ai-state/design/event-naming.md`.
- Architecture freeze/deprecated runtime notes should be merged into `docs/ai-state/decisions/architecture-decisions.md`.
- Inventory transaction rules and Phase 1 migration details should be merged into `docs/ai-state/decisions/inventory-decisions.md` and `docs/ai-state/modules/inventory.md`.
- Known issues should be merged into a future `docs/ai-state/audits/technical-debt-audit.md`.
- Tree structure guidance should be merged into `docs/ai-state/CODEX_WORKFLOW.md` or a future `docs/ai-state/design/repo-structure.md`.

## Directory Review

| Path | Status | Classification | Notes |
| --- | --- | --- | --- |
| `docs/api` | Empty / no markdown files found | KEEP | Keep directory only if API docs will be regenerated. No merge content exists. |
| `docs/backend` | Empty / no markdown files found | KEEP | Keep as placeholder if backend-specific docs are planned. |
| `docs/database` | Empty / no markdown files found | KEEP | Keep as placeholder if schema/data docs are planned. |
| `docs/frontend` | Empty / no markdown files found | KEEP | Keep as placeholder if frontend design/system docs are planned. |
| `docs/issues` | Empty / no markdown files found | KEEP | Keep as placeholder or eventually replace with ai-state audits. |
| `docs/roadmap` | Empty / no markdown files found | KEEP | Current roadmap content is in root `docs/ROADMAP.md` and ai-state task/status files. |
| `docs/setup` | Empty / no markdown files found | KEEP | Keep if setup docs are planned. |

## Document Classification

### `docs/AI_CONTEXT.md`

Classification: MERGE

Superseded by ai-state:

- Project identity, module list, architecture style, workflow priority, and long-term vision are now mostly represented in `CURRENT_STATE.md`, `PROJECT_STATUS.md`, `CURRENT_MODULES.md`, `CODEX_WORKFLOW.md`, and architecture decisions.

Unique information:

- Concise general project identity for an AI assistant.
- Long-term vision items: BIM, GPS, mobile warehouse app, IoT, multi-company, offline warehouse mode.
- Explicit broad rule list for module isolation, event payload size, shared components, and scalability.

Recommended action:

- Merge unique long-term vision and non-duplicated rules into `CODEX_WORKFLOW.md` or `architecture-decisions.md`.
- After merge, archive this as legacy onboarding context.

### `docs/AI_RULES.md`

Classification: MERGE

Superseded by ai-state:

- Many rules overlap with `CODEX_WORKFLOW.md`, `architecture-decisions.md`, `inventory-decisions.md`, and current ai-state workflow requirements.

Unique information:

- Compact rule checklist for backend/controller/service/repository responsibilities.
- Explicit realtime delta payload rule.
- Security, logging, performance, database timestamp guidance.

Recommended action:

- Merge durable engineering rules into `CODEX_WORKFLOW.md` and `architecture-decisions.md`.
- Keep until merged because it is still useful as a concise rule source.

### `docs/KNOWN_ISSUES.md`

Classification: MERGE

Superseded by ai-state:

- Some issues are now tracked indirectly in `NEXT_TASKS.md`, `documentation-audit.md`, and module docs.

Unique information:

- Short technical-debt list: duplicate imports, Prisma duplicate fields, large files, weak type safety, direct Prisma usage, realtime payload size, UI inconsistency.

Recommended action:

- Merge into a new `docs/ai-state/audits/technical-debt-audit.md`.
- After merge, archive this legacy root issue list.

### `docs/PROJECT_OVERVIEW.md`

Classification: ARCHIVE

Superseded by ai-state:

- Overview, philosophy, stack, modules, design decisions, and future expansion are covered more accurately by `CURRENT_STATE.md`, `PROJECT_STATUS.md`, `CURRENT_MODULES.md`, and decisions docs.

Unique information:

- Minimal standalone product overview.

Recommended action:

- Archive as historical overview after any useful phrasing is merged into `CURRENT_STATE.md`.
- Do not use as current technical source because backend stack references are stale relative to current Nest-style backend.

### `docs/ROADMAP.md`

Classification: MERGE

Superseded by ai-state:

- Active task ordering and current priorities are tracked in `NEXT_TASKS.md`, `PROJECT_STATUS.md`, and `CURRENT_STATE.md`.

Unique information:

- Long-horizon phase labels: ERP Foundation, Workflow Stabilization, Realtime Infrastructure, Advanced ERP Features, Factory Intelligence, Enterprise Scaling.

Recommended action:

- Merge stable long-horizon phase names into `NEXT_TASKS.md` or a future `docs/ai-state/roadmap.md`.
- Archive root roadmap afterward.

### `docs/TREE_STRUCTURE.md`

Classification: MERGE

Superseded by ai-state:

- Workflow and module doc structure are now defined in `CODEX_WORKFLOW.md`.
- Current module status is in `CURRENT_MODULES.md`.

Unique information:

- Folder standards for frontend/backend module structure.
- Shared UI, services, repositories, hooks placement guidance.

Outdated information:

- References some folders/modules that do not match the current active app structure.
- Embeds a duplicated `PROJECT_OVERVIEW.md` section inside the same file.

Recommended action:

- Merge accurate folder standards into `CODEX_WORKFLOW.md` or a new `docs/ai-state/design/repo-structure.md`.
- Archive the legacy file after merge.

### `docs/architecture/ARCHITECTURE_FREEZE.md`

Classification: MERGE

Superseded by ai-state:

- Core architectural direction is covered by `architecture-decisions.md` and `CODEX_WORKFLOW.md`.

Unique information:

- Explicit `STATUS: ACTIVE`.
- Deprecated runtime names: `cockpit-runtime`, `workspace-runtime`, `telemetry-runtime`, duplicated engine layers.
- Strict rules: no duplicate runtimes, no duplicate workspace systems, no direct Prisma usage in controllers, no giant components, no experimental abstractions in core.
- Official frontend/backend root folder lists.

Recommended action:

- Merge deprecated runtime list and strict freeze rules into `architecture-decisions.md`.
- Keep until merged because the deprecated runtime names are unique and operationally useful.

### `docs/architecture/EVENT_NAMING.md`

Classification: KEEP

Superseded by ai-state:

- Not fully superseded. Current ai-state mentions event-driven architecture but does not define event naming standards.

Unique information:

- Canonical event naming format: `domain.entity.action`.
- Examples for inventory, production, QC, Yard, and project events.
- Lightweight payload rule.

Recommended action:

- Keep as a focused design reference or merge into `docs/ai-state/design/event-naming.md` later.

### `docs/architecture/INVENTORY_TRANSACTION_RULES.md`

Classification: MERGE

Superseded by ai-state:

- Transaction-first Inventory is documented in `inventory-decisions.md`, `architecture-decisions.md`, and `modules/inventory.md`.

Unique information:

- Very concise canonical stock mutation rules.
- Transaction type list includes `RECEIVE`, `ISSUE`, `TRANSFER`, `RETURN`, `RESERVE`, `ADJUSTMENT`, `CONSUME`, `PRODUCTION_OUTPUT`.
- Immutable transaction rule.

Recommended action:

- Merge transaction type list and immutability language into `inventory-decisions.md`.
- Keep until merged because it is a useful quick reference.

### `docs/architecture/REFACTOR_MASTER_PLAN.md`

Classification: ARCHIVE

Superseded by ai-state:

- Active next steps are now in `NEXT_TASKS.md`; current architecture decisions are in `decisions/*.md`.

Unique information:

- Historical five-phase refactor plan.

Recommended action:

- Archive as historical planning once any still-relevant phase names are folded into ai-state roadmap/task docs.

### `docs/inventory/inventory-phase1-migration-plan.md`

Classification: MERGE

Superseded by ai-state:

- Current Inventory state is in `modules/inventory.md`, `inventory-decisions.md`, and `CURRENT_STATE.md`.

Unique information:

- Phase 1 migration scope and rollout sequence.
- Data compatibility strategy explaining no schema change for Phase 1.
- API change notes for `GET /inventory/items/:id/detail`.
- Risks/mitigations around legacy snapshot quantity and historical transactions.

Recommended action:

- Merge rollout history and compatibility rationale into `inventory-decisions.md` or an Inventory audit/history doc.
- Keep until merged because it explains why snapshot compatibility exists.

### `docs/modules/COMPONENTS.md`

Classification: DELETE

Superseded by ai-state:

- No content exists in this file.

Unique information:

- None. File size is zero bytes.

Recommended action:

- Do not delete during this audit.
- Candidate for deletion after a proper `docs/ai-state/modules/components.md` is created.

### `docs/modules/INVENTORY.md`

Classification: DELETE

Superseded by ai-state:

- Empty file. Current Inventory docs live in `docs/ai-state/modules/inventory.md` and `docs/ai-state/decisions/inventory-decisions.md`.

Unique information:

- None. File size is zero bytes.

Recommended action:

- Do not delete during this audit.
- Candidate for deletion.

### `docs/modules/YARD.md`

Classification: DELETE

Superseded by ai-state:

- Empty file. Current Yard summary lives in `docs/ai-state/modules/yard.md`.

Unique information:

- None. File size is zero bytes.

Recommended action:

- Do not delete during this audit.
- Candidate for deletion.

## Merge Priority

1. Merge `docs/architecture/ARCHITECTURE_FREEZE.md` into `docs/ai-state/decisions/architecture-decisions.md`.
2. Merge `docs/architecture/EVENT_NAMING.md` into `docs/ai-state/design/event-naming.md`.
3. Merge `docs/architecture/INVENTORY_TRANSACTION_RULES.md` and `docs/inventory/inventory-phase1-migration-plan.md` into `docs/ai-state/decisions/inventory-decisions.md`.
4. Merge `docs/KNOWN_ISSUES.md` into a new `docs/ai-state/audits/technical-debt-audit.md`.
5. Merge accurate parts of `docs/TREE_STRUCTURE.md` into `CODEX_WORKFLOW.md` or `docs/ai-state/design/repo-structure.md`.
6. Archive `docs/PROJECT_OVERVIEW.md`, `docs/ROADMAP.md`, and `docs/architecture/REFACTOR_MASTER_PLAN.md` after useful content is folded into ai-state.

## Do Not Delete Yet

No deletion is recommended until:

- Unique content has been merged into ai-state.
- Empty legacy placeholders are replaced by real ai-state module docs where needed.
- The team confirms whether root-level `docs/AI_CONTEXT.md` and `docs/AI_RULES.md` must remain as stable onboarding entry points.
