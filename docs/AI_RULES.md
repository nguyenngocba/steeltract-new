# STEELTRACK AI RULES

# 1. Architecture Rules

- Use Modular Monolith Architecture.
- Keep modules isolated.
- Never tightly couple modules.
- Never create giant files.

---

# 2. Backend Rules

Controllers:
- validate request
- call services only
- no business logic
- no Prisma queries

Correct Flow:

Controller
→ Service
→ Repository
→ Prisma

---

# 3. Service Rules

Services:
- contain business logic
- coordinate workflows
- emit events
- call repositories

Services MUST NOT:
- manipulate HTTP response directly

---

# 4. Repository Rules

Repositories:
- contain database queries only
- reusable query logic
- no business logic

---

# 5. Inventory Rules

Inventory system is transaction-based.

NEVER:
quantity += x

ALWAYS:
create InventoryTransaction

InventoryTransaction is source of truth.

InventoryItem.quantity is cache/snapshot only.

---

# 6. Event Rules

Modules communicate via:
- Events
- Service Interfaces

Avoid direct cross-module logic.

---

# 7. Realtime Rules

Never emit full object payloads.

Correct:
socket.emit({
  id,
  changedFields,
})

Frontend must refetch data using TanStack Query.

---

# 8. Frontend Rules

Use:
- shared components
- shared layouts
- shared tables

Avoid duplicated UI.

---

# 9. State Management Rules

Use Zustand for:
- auth
- theme
- sidebar
- UI state

Use TanStack Query for:
- server state
- API cache
- realtime refetch
- optimistic updates

---

# 10. Type Safety Rules

Avoid any.

Use:
- DTO
- interfaces
- Zod
- ValidationPipe

---

# 11. Database Rules

Every table should contain:
- id
- createdAt
- updatedAt

Future-ready:
- createdBy
- updatedBy
- deletedAt

---

# 12. Logging Rules

Critical actions must create logs:
- CREATE
- UPDATE
- DELETE
- APPROVE
- LOGIN
- EXPORT

---

# 13. Performance Rules

Use:
- pagination
- lazy loading
- virtualization
- caching

Avoid:
- huge raw queries
- unnecessary rerenders

---

# 14. Security Rules

Never hardcode secrets.

Use:
process.env

Validate:
- uploads
- permissions
- JWT
- request input