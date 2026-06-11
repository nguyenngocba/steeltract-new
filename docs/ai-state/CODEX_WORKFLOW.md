# STEELTRACK AI WORKFLOW

## PROJECT IDENTITY

SteelTrack is an ERP + MES + Yard Management platform for steel fabrication.

Current priority:

1. Inventory
2. Components
3. Production
4. Yard
5. Projects
6. Suppliers
7. Organizations
8. QC
9. Logistics
10. Settings

Do not create unrelated enterprise modules.

---

## REQUIRED READING

Before coding, read:

1. `docs/ai-state/PROJECT_STATUS.md`
2. `docs/ai-state/CURRENT_STATE.md`
3. `docs/ai-state/NEXT_TASKS.md`
4. Related module docs in `docs/ai-state/modules/`
5. Use Semble before grep for code discovery.
6. Use Context7 before framework or library changes.
7. Build before completion.
8. Update ai-state docs after workflow changes.

For broader project context, also read:

* `docs/ai-state/CURRENT_MODULES.md`
* `docs/ai-state/CHANGELOG_AI.md`
* `docs/ai-state/decisions/architecture-decisions.md`
* `docs/ai-state/design/repo-structure.md`


---

## TOOL USAGE

Use Semble for:

* Finding related code
* Finding routes
* Finding modules
* Finding existing components
* Refactoring

Use Context7 for:

* React
* Vite
* Prisma
* TanStack Query
* ThreeJS
* React Three Fiber
* PixiJS
* External libraries

Never implement framework code from memory when Context7 documentation is available.

---

## DEVELOPMENT RULES

Before creating a file:

1. Search existing implementation first.
2. Reuse existing code whenever possible.
3. Avoid duplicate pages.
4. Avoid duplicate routes.
5. Avoid duplicate layouts.
6. Avoid duplicate modules.

Extend existing modules whenever possible.

---

## ENGINEERING RULES

Backend:

1. Controllers validate requests and call services.
2. Services contain business logic, coordinate workflows, and emit events.
3. Repositories contain reusable database query logic.
4. New backend work should follow Controller -> Service -> Repository -> Prisma.
5. Existing direct Prisma usage is technical debt unless intentionally left untouched.

Frontend:

1. Use shared components, shared layouts, and shared table/panel patterns.
2. Use TanStack Query for server state.
3. Use Zustand for durable UI state such as auth, theme, sidebar, and global UI state when needed.
4. Avoid duplicated UI and giant page files.

Inventory:

1. Inventory is transaction-based.
2. Never directly edit stock quantity as the primary business operation.
3. Create Inventory transactions and transaction items for stock-affecting workflows.
4. `InventoryItem.quantity` is a cache/snapshot only.

Realtime:

1. Never emit full object payloads.
2. Emit lightweight identifiers and changed fields.
3. Frontend should refetch through TanStack Query or the relevant API after realtime signals.

Type safety and validation:

1. Avoid `any` in new code.
2. Prefer DTOs, interfaces, Zod schemas, and validation pipes.
3. Validate uploads, permissions, JWT, and request input.

Logging:

1. Critical actions should create logs: create, update, delete, approve, login, export.

Performance:

1. Use pagination, lazy loading, virtualization, and caching where appropriate.
2. Avoid huge raw queries and unnecessary rerenders.

---

## MODULE POLICY

Preferred business modules:

Dashboard
Inventory
Components
Production
Yard
Projects
Suppliers
Organizations
QC
Logistics
Settings

Do not create new top-level modules unless explicitly requested.

---

## TASK COMPLETION POLICY

A task is NOT complete until:

1. Code is implemented.
2. Build passes.
3. Routes are registered.
4. Navigation is updated if required.
5. Documentation is updated.

For documentation-only tasks, skip code/build requirements that do not apply, but still validate file structure and update `CHANGELOG_AI.md`.

---

## DOCUMENTATION UPDATE POLICY

After EVERY completed task automatically update:

docs/ai-state/CHANGELOG_AI.md

docs/ai-state/PROJECT_STATUS.md

docs/ai-state/NEXT_TASKS.md

If module status changed:

docs/ai-state/CURRENT_MODULES.md

Documentation update is mandatory.

Never finish a task without updating AI state files.

---

After every completed task:

1. Update CHANGELOG_AI.md
2. Update PROJECT_STATUS.md
3. Update NEXT_TASKS.md
4. Update CURRENT_MODULES.md (if status changed)

For any module reaching 20%+ completion:

Create or update:
--------------------------------
docs/ai-state/modules/<module>.md

Example:

modules/suppliers.md
modules/yard.md
modules/production.md

This file must contain:

- Scope
- Implemented Features
- Database Models
- API Endpoints
- Routes
- Remaining Tasks
--------------------------------
## CHANGELOG FORMAT

Example:

## 2026-06-02

Completed:

* Added Components Stock Page
* Added Components Transfer Page

Modified:

* Sidebar Navigation
* Components Routes

Notes:

* Components module now 60% complete

---

## PROJECT STATUS FORMAT

Inventory      100%
Components      60%
Production      30%
Yard             0%
Projects         0%
Suppliers        0%

Always keep percentages realistic.

---

## NEXT TASKS FORMAT

Remove completed tasks.

Add newly discovered tasks.

Always keep tasks ordered by priority.

---

## CURRENT MODULES FORMAT

Completed:
✅

In Progress:
🚧

Not Started:
❌

Keep status updated after every task.

---

## FINAL RULE

Every new chat session must start by reading:

docs/ai-state/PROJECT_STATUS.md
docs/ai-state/CURRENT_STATE.md
docs/ai-state/NEXT_TASKS.md
docs/ai-state/CURRENT_MODULES.md
docs/ai-state/CODEX_WORKFLOW.md

before performing any development work.
