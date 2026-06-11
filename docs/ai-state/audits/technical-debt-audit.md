# Technical Debt Audit

Source:

- Merged from legacy `docs/KNOWN_ISSUES.md` during documentation cleanup on 2026-06-11.

## Known Issues

### Duplicate Imports

Issue:

- Duplicate React/page/icon imports can cause build errors.

Expected fix:

- Remove duplicated imports during normal feature work.

### Prisma Duplicate Fields

Issue:

- Schema edits can accidentally introduce duplicate fields.

Expected fix:

- Review Prisma schema carefully before generating or applying migrations.

### Large Component Files

Issue:

- Pages and modals can become too large as workflows are added quickly.

Expected fix:

- Extract shared components, hooks, services, and visual helpers where this reduces real complexity.

### Weak Type Safety

Issue:

- Too many `any` types remain in older frontend and backend code.

Expected fix:

- Prefer DTOs, interfaces, Zod validation, and typed API contracts for new work.

### Direct Prisma Usage

Issue:

- Some controllers/services still query Prisma directly.

Expected fix:

- New backend code should follow Controller -> Service -> Repository -> Prisma.
- Existing direct Prisma usage should be refactored opportunistically when touching that workflow.

### Realtime Payload Size

Issue:

- Large realtime payloads couple clients to backend object shapes.

Expected fix:

- Send lightweight delta events and let clients refetch.

### UI Inconsistency

Issue:

- Older pages use different layouts and visual systems.

Expected fix:

- Continue aligning active pages to the Inventory dark cockpit baseline and shared table/panel patterns.

### Rapid Expansion Risk

Issue:

- Fast module expansion can leave duplicated routes, duplicated runtimes, and stale docs.

Expected fix:

- Maintain ai-state docs, preserve module boundaries, and prefer extending existing systems.
