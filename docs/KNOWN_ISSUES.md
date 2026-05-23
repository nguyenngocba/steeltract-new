# STEELTRACK KNOWN ISSUES

# 1. Duplicate Imports

Issue:
Duplicate React/page/icon imports causing build errors.

Fix:
Remove duplicated imports.

---

# 2. Prisma Duplicate Fields

Issue:
Duplicate schema fields.

Fix:
Check schema carefully before migration.

---

# 3. Large Component Files

Issue:
Pages becoming too large.

Fix:
Extract:
- shared components
- hooks
- services

---

# 4. Weak Type Safety

Issue:
Too many any types.

Fix:
Use:
- DTO
- interfaces
- Zod validation

---

# 5. Direct Prisma Usage

Issue:
Controllers querying Prisma directly.

Fix:
Use:
Controller
→ Service
→ Repository
→ Prisma

---

# 6. Realtime Payload Size

Issue:
Sending huge objects over websocket.

Fix:
Send delta updates only.

---

# 7. UI Inconsistency

Issue:
Different page layouts/styles.

Fix:
Use shared components:
- PageHeader
- DashboardCard
- SectionCard
- StatusBadge

---

# 8. Technical Debt Risk

Issue:
Rapid feature expansion.

Fix:
Maintain:
- modular structure
- docs
- shared systems
- architecture discipline