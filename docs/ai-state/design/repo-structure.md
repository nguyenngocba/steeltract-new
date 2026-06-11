# Repository Structure Guidance

This document preserves the useful module/folder guidance from legacy `docs/TREE_STRUCTURE.md`. It is guidance, not a full generated tree.

## Root

Expected top-level areas:

- `apps/`
- `docs/`
- `scripts/`
- `backups/`
- infrastructure/deployment folders where applicable.

## Frontend

Primary active app:

- `apps/frontend/src/`

Recommended frontend roots:

- `components/`
- `layouts/`
- `modules/`
- `hooks/`
- `stores/`
- `lib/`
- `services/`
- `types/`
- `routes/`
- `pages/`

Recommended module structure:

- `api/`
- `components/`
- `hooks/`
- `pages/`
- `services/`
- `store/`
- `types/`
- `utils/`
- `index.ts`

Guidance:

- Shared UI belongs in shared components or module visual components.
- Reusable server-state reads should use TanStack Query hooks.
- UI-only state can use local state or shared UI stores where appropriate.
- Avoid placing large workflow logic directly inside pages.

## Backend

Primary active app:

- `apps/backend-api/src/`

Recommended backend roots:

- `modules/`
- `core/`
- `shared/`
- gateway/websocket/infrastructure folders where applicable.

Recommended module structure:

- `controllers/`
- `services/`
- `repositories/`
- `dto/`
- `events/`
- `entities/`
- `validators/`
- `types/`
- `index.ts`

Guidance:

- Business logic belongs in services.
- Database queries belong in repositories for new code.
- Controllers should validate and call services only.
- Avoid duplicate runtime systems and duplicate workspace systems.

## Documentation

Current operational documentation root:

- `docs/ai-state/`

Important ai-state files:

- `CODEX_WORKFLOW.md`
- `CURRENT_STATE.md`
- `PROJECT_STATUS.md`
- `NEXT_TASKS.md`
- `CURRENT_MODULES.md`
- `CHANGELOG_AI.md`
- `modules/*.md`
- `decisions/*.md`
- `audits/*.md`
- `design/*.md`

Legacy docs may remain under `docs/` until merged, archived, or deleted according to ai-state audits.
