# STEELTRACK AI CONTEXT

## Project Type

STEELTRACK is an enterprise ERP platform for steel structure fabrication factories.

The system manages:

- Inventory
- Production
- Planning
- QC
- Logistics
- Material Yard
- Projects
- Users & Permissions
- Reports
- Realtime Tracking

---

# Architecture

Architecture Style:
- Modular Monolith
- Domain-driven structure
- Event-driven internal communication
- Future microservices-ready

Frontend:
- React
- Vite
- TypeScript
- TailwindCSS
- Zustand
- TanStack Query
- shadcn/ui

Backend:
- Node.js
- Fastify
- Prisma
- PostgreSQL
- Zod validation

Realtime:
- Socket.io
- Delta update strategy
- Lightweight websocket payload

---

# Business Workflow

Main Workflow:

Project
→ Planning
→ Production
→ QC
→ Warehouse
→ Transport
→ Installation

---

# Current System Phase

Current phase:
- ERP Foundation
- Module Scaffolding
- Shared Component System
- Architecture Stabilization

NOT in optimization phase yet.

Priority:
- clean architecture
- modular structure
- reusable systems
- enterprise workflow

---

# Important Rules

1. Keep modules isolated.

2. Never query another module tables directly.

3. Use:
Controller
→ Service
→ Repository
→ Prisma

4. Inventory system must be transaction-based.

5. Never emit full objects over websocket.

6. Use shared components whenever possible.

7. Avoid giant files.

8. Keep future scalability in mind.

---

# Long-term Vision

Future goals:
- AI forecasting
- BIM integration
- GPS tracking
- Mobile warehouse app
- IoT integration
- Realtime factory dashboard
- Multi-company ERP
- Offline warehouse mode