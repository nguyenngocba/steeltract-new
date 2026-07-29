# UI.OPS.3B Operational Forms Convergence Report

Date: 2026-07-28

Status: IMPLEMENTED - FRONTEND-FIRST

## Shared Form Pattern

Added reusable shared form primitives in `apps/frontend/src/shared/forms/EnterpriseForm.tsx`:

- `EnterpriseOperationalFormLayout`
- `EnterpriseAssistantPanel`
- `EnterpriseSummaryPanel`
- `EnterpriseSuggestionButton`

These are business-agnostic layout primitives for the operational form pattern:

Primary form -> readonly/context assistant -> command summary -> sticky modal footer.

They do not contain Components, Production, QC or Inventory business logic.

## Component Form

Updated both Components create entry points to use one shared canonical form:

- `apps/frontend/src/modules/components/components/ComponentDefinitionRequirementForm.tsx`
- `apps/frontend/src/modules/components/context/ComponentsActionContext.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsListPage.tsx`

The form now presents:

- `Thông tin công trình`
- `Thông tin cấu kiện`
- real suggestions from existing Component definitions and Project context
- explicit consequence summary

Suggestion sources:

- existing Components loaded from the authenticated Components read/API path
- existing Projects loaded from the authenticated Projects hook

Suggestion behavior:

- applies only safe editable fields: component type/profile
- never copies lifecycle, BOM release state, inventory, physical instances or Production Orders
- empty source data renders `Chưa có dữ liệu gợi ý phù hợp`

Canonical semantics preserved:

- creates Component Definition in Draft
- creates ProjectComponentRequirement
- does not create ComponentInstance
- does not create inventory quantity
- does not create ProductionOrder

## BOM Form

Updated `apps/frontend/src/modules/production/components/ProductionBomModal.tsx`.

The BOM form still uses UI.OPS.3A semantics:

- Material Master is the engineering material identity source
- Production Warehouse stock is readonly availability enrichment
- zero Production stock does not block engineering BOM definition
- BOM form does not transfer, reserve or issue material

Added assistant panels for:

- selected material identity and unit
- Production stock / reserved / available quantity
- Production location labels
- BOM selected-line availability
- real Material Master suggestions with positive Production availability

No hardcoded material names, Beam/Profile lists or demo suggestions were added.

## Production Order Form

Updated `apps/frontend/src/modules/production/components/ManufacturingOrderModal.tsx`.

Requirement-first behavior is clearer:

- selecting ProjectComponentRequirement defaults production quantity to remaining requirement quantity
- quantity greater than remaining requirement shows immediate validation
- explicit action `Dùng số lượng còn lại` applies the valid remaining quantity
- primary backend command remains canonical `POST /production/commands/orders`

Assistant panel shows readonly:

- required quantity
- allocated quantity
- remaining quantity
- Revision
- BOM state
- routing readiness

Material shortage fields intentionally render controlled non-fabricated messaging because no authoritative requirement-level shortage read-model is exposed in this form contract yet.

## QC Form

Updated `apps/frontend/src/modules/qc/pages/QcPage.tsx`.

Final QC remains canonical:

- target is `ComponentInstance`
- queue is sourced from `GET /components/foundation/instances?state=PRODUCED_WAITING_QC`
- PASS/FAIL commands operate on the generated inspection for the selected physical instance

Improved final instance detail:

- shows FINAL checklist code/name/revision when available
- shows completed operation count and lineage evidence
- disables PASS/FAIL when FINAL checklist is unavailable instead of allowing a runtime failure
- keeps Finished Goods eligibility as backend-owned

Legacy QC production/inbound pages remain readable and unchanged.

## Detail Drawer Convergence

This sprint applied convergence to active operational forms and the Final QC instance detail modal.

No information was removed. Details remain bounded with a single internal scroll owner and footer actions where applicable.

## Backend Changes

None.

No Prisma schema changes, migrations, API redesign, Snapshot Engine changes, Historical Dashboard changes, Inventory business logic changes or Production/QC command changes were made.

## Tests

Executed:

- `pnpm -C apps/frontend test` - PASS
- `pnpm -C apps/frontend build` - PASS with existing Vite chunk-size warning

Pending final verification:

- `pnpm -C apps/backend-api build`
- `git diff --check`

## Screens / Runtime Review

Source/build review completed.

Authenticated browser smoke was not performed in this pass because the current shared harness/database runtime is still tracked separately from DOMAIN5G/UI.OPS follow-ups.

## Remaining Issues

P1:

- Add an authoritative Production requirement material-shortage read-model if the Production Order assistant must show exact shortage lines before reservation.
- Browser screenshot review for the four converged forms against Inventory receipt form.
- Decide whether BOM modal should expose an existing Inventory material-create flow as a separate explicit action.

P2:

- Add richer checklist-template UI once final QC checklist entry capture is expanded beyond PASS/FAIL.
