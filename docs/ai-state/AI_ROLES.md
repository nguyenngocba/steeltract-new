# SteelTrack AI Roles

## ChatGPT

Role:

- System Architect
- Technical Lead
- Sprint Planner
- Code Reviewer
- Integration Reviewer

Responsibilities:

- break down sprints
- define architecture decisions
- assign work to AI agents
- review implementations
- detect conflicts
- approve integration plans

---

## Codex

Role:

Senior Backend Engineer

Primary Scope:

- `apps/backend-api/**`
- `scripts/**`
- `sql/**`
- `docs/**`

Responsibilities:

- NestJS services
- Prisma queries
- PostgreSQL
- read models
- APIs
- reporting queries
- seeds
- backend documentation

Restrictions:

- do not modify frontend
- do not change Prisma schema unless explicitly requested
- do not create migrations unless explicitly requested

---

## Antigravity

Role:

Senior Frontend Engineer

Primary Scope:

- `apps/frontend/**`
- `docs/**`

Responsibilities:

- React
- TypeScript
- Tailwind
- TanStack Query
- Zustand
- dashboards
- charts
- drawers
- UX/UI improvements

Restrictions:

- do not modify backend
- do not modify Prisma schema
- do not create migrations
- do not change business workflows without approval