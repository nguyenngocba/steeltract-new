# SteelTrack AGENTS

## Read First

1. `docs/ai-state/CODEX_WORKFLOW.md`
2. `docs/ai-state/CURRENT_STATE.md`
3. `docs/ai-state/PROJECT_STATUS.md`
4. `docs/ai-state/NEXT_TASKS.md`

## Documentation

Primary source of truth:

`docs/ai-state/`

Important sections:

* `modules/`
* `decisions/`
* `audits/`
* `design/`

## Code Discovery

Use Semble before grep.

Examples:

```bash
semble search "inventory location stock" .
semble search "WarehouseMiniMap" .
semble search "production warehouse" .
```

Use grep only for exact string matching.

## Framework Guidance

Use Context7 before framework-level changes.

Examples:

* NestJS
* Prisma
* React
* TanStack Query

## Inventory Rules

Read:

`docs/ai-state/decisions/inventory-decisions.md`

before changing inventory logic.

## Production Rules

Read:

`docs/ai-state/decisions/production-decisions.md`

before changing production logic.

## Workflow

Always follow:

`docs/ai-state/CODEX_WORKFLOW.md`

## Documentation Updates

If workflow or architecture changes, update:

* `CURRENT_STATE.md`
* `CHANGELOG_AI.md`
* related module docs
* related decision docs
## Safety Rules

Never:

- create Prisma migrations unless explicitly requested
- modify `apps/backend-api/prisma/schema.prisma` unless explicitly requested
- delete existing modules
- refactor unrelated code
- modify authentication, role, permission modules unless explicitly requested
- modify more than 10 files in one iteration without explaining why

Before changing files:

1. List files that will be modified.
2. Explain why each file needs to change.
3. If changes span backend and frontend together, explain the dependency first.

## Scope Ownership

Backend scope:

- `apps/backend-api/**`
- `scripts/**`
- `sql/**`
- `docs/**`

Frontend scope:

- `apps/frontend/**`
- `docs/**`

Do not modify both backend and frontend in the same iteration unless explicitly requested.

## Verification Requirements

After every implementation:

1. Update documentation:

- `docs/ai-state/CHANGELOG_AI.md`
- `docs/ai-state/CURRENT_STATE.md`
- `docs/ai-state/PROJECT_STATUS.md`
- `docs/ai-state/NEXT_TASKS.md`
- related module docs
- related decision docs

2. Run verification:

```bash
pnpm -C apps/frontend build
pnpm -C apps/backend-api build
```

3. Report:

- Files changed
- Verification results
- Known limitations
- Follow-up recommendations
## Git Safety

Before large changes:

```bash
git add .
git commit -m "checkpoint before <task>"
```

If implementation fails:

```bash
git reset --hard HEAD
```

Never perform git reset, rebase, force push, branch deletion or destructive git operations without explicit approval.