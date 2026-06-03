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

Before starting ANY task, read:

docs/AI_CONTEXT.md
docs/AI_RULES.md

docs/ai-state/CURRENT_MODULES.md
docs/ai-state/PROJECT_STATUS.md
docs/ai-state/NEXT_TASKS.md
docs/ai-state/CHANGELOG_AI.md

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

docs/AI_CONTEXT.md
docs/AI_RULES.md
docs/ai-state/*

before performing any development work.
