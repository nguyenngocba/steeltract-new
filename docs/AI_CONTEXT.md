# STEELTRACK ERP — AI CONTEXT

## PROJECT TYPE
Enterprise ERP System for Steel Structure Manufacturing

## STACK

### FRONTEND
- React
- TypeScript
- Vite
- TailwindCSS
- Zustand
- Axios

### BACKEND
- NestJS
- Prisma ORM
- JWT Auth
- PostgreSQL

### INFRASTRUCTURE
- Rocky Linux 9
- Node.js 22
- pnpm
- GitHub

---

# CURRENT STATUS

## COMPLETED
- Monorepo setup
- Frontend foundation
- Backend foundation
- PostgreSQL setup
- Prisma schema
- JWT login API
- ERP dashboard layout
- Sidebar navigation
- Protected routes
- Login page
- Zustand auth store

---

# DATABASE TABLES

- users
- roles
- permissions
- inventory_items
- inventory_categories
- inventory_transactions
- inventory_transaction_items
- projects
- components
- activity_logs
- notifications

---

# FRONTEND STRUCTURE

apps/frontend

- components/ui
- layouts
- pages
- routes
- store
- lib

---

# BACKEND STRUCTURE

apps/backend-api

- core/prisma
- modules/auth
- modules/users

---

# LOGIN

## URL
/login

## DEFAULT ACCOUNT
username: admin
password: admin123

---

# IMPORTANT NOTES

## PRISMA
Use Prisma 6 ONLY.
Prisma 7 caused runtime issues with NestJS.

## FIREWALL
Need open ports:
- 5173 frontend
- 3000 backend

## BACKEND
Need enable CORS in main.ts

---

# FUTURE MODULES

- Inventory Management
- Supplier Management
- Project Management
- BOM
- Production
- Warehouse
- Notifications
- Reports
- Role Permissions
- Audit Logs

---

# CURRENT ARCHITECTURE

Frontend:
React + Zustand + Axios

Backend:
NestJS + Prisma + PostgreSQL

Authentication:
JWT

---

# GOAL

Build a scalable enterprise ERP system for steel structure manufacturing companies.
