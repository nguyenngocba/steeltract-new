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
