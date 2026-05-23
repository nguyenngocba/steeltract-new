# STEELTRACK TREE STRUCTURE

# Root Structure

```txt
steeltrack/
├── apps/
├── docs/
├── packages/
├── infrastructure/
├── scripts/
└── backups/

Frontend Structure

apps/frontend/src/
├── components/
│   ├── shared/
│   ├── dashboard/
│   ├── tables/
│   └── charts/
│
├── layouts/
│
├── modules/
│   ├── inventory/
│   ├── production/
│   ├── planning/
│   ├── qc/
│   ├── projects/
│   ├── transport/
│   ├── users/
│   └── _template/
│
├── hooks/
├── stores/
├── lib/
├── services/
├── types/
├── routes/
└── pages/

Frontend Module Standard

module/
├── api/
├── components/
├── hooks/
├── pages/
├── services/
├── store/
├── types/
├── utils/
└── index.ts

Backend Structure

apps/backend-api/src/
├── modules/
├── gateways/
├── websocket/
├── queues/
├── middleware/
├── services/
├── utils/
├── prisma/
└── config/

Backend Module Standard

module/
├── controllers/
├── services/
├── repositories/
├── dto/
├── events/
├── entities/
├── validators/
├── types/
└── index.ts

Docs Structure

docs/
├── AI_CONTEXT.md
├── AI_RULES.md
├── TREE_STRUCTURE.md
├── PROJECT_OVERVIEW.md
├── ROADMAP.md
└── KNOWN_ISSUES.md

Important Rules
Shared UI goes to:
components/shared/
Business logic belongs in:
services/
Database queries belong in:
repositories/
Reusable hooks go to:
hooks/
Avoid placing huge logic inside pages.
Every module must stay isolated.


---

# 4. `docs/PROJECT_OVERVIEW.md`

```md
# STEELTRACK ERP

# Overview

STEELTRACK is an enterprise ERP platform designed for steel structure fabrication factories.

The platform manages:

- Inventory
- Production
- Planning
- QC
- Logistics
- Material Yard
- Projects
- Reports
- Users & Permissions

---

# Core Philosophy

- Modular
- Scalable
- Event-driven
- Realtime-ready
- Audit-ready
- AI-ready

---

# Main Goals

1. Manage entire steel fabrication workflow.

2. Track production realtime.

3. Manage warehouse and materials.

4. Improve factory visibility.

5. Prepare future AI integration.

---

# Technology Stack

Frontend:
- React
- Vite
- TypeScript
- Zustand
- TanStack Query
- TailwindCSS

Backend:
- Node.js
- Fastify
- Prisma
- PostgreSQL

Realtime:
- Socket.io

---

# Main Modules

- Dashboard
- Inventory
- Production
- Planning
- QC
- Projects
- Transport
- Users
- Notifications
- Reports

---

# Long-term Vision

Future expansion:
- AI Forecasting
- BIM Integration
- GPS Tracking
- Mobile Warehouse App
- IoT Smart Factory
- Multi-company ERP
- Offline Mode