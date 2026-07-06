# Inventory Workspace Recovery Report

Date: 2026-07-02

## Context

`docs/audit/inventory-workspace-audit.md` found that several Inventory pages still had live routes but were hidden from the sidebar. Sprint INV.NAV.2 restored access to those operational pages without changing the existing route model.

## Recovery Matrix

| Workspace | Route | Sidebar Placement | Recovery Status | Notes |
| --- | --- | --- | --- | --- |
| Tổng quan kho | `/inventory` | Primary Inventory | Existing | Kept visible. |
| Vật tư & Tồn kho | `/inventory/materials` | Primary Inventory | Existing | Kept visible as the consolidated material/stock workspace. |
| Giao dịch | `/inventory/transactions` | Primary Inventory | Existing | Kept visible. |
| Phiếu trả vật tư | `/inventory/returns` | Primary Inventory | Existing | Kept visible. |
| Vị trí kho | `/inventory/locations` | Primary Inventory | Existing | Kept visible. |
| Nhập kho | `/inventory/inbound` | Nghiệp vụ nâng cao | Restored | Route reused; no router change. |
| Xuất kho | `/inventory/outbound` | Nghiệp vụ nâng cao | Restored | Route reused; no router change. |
| Điều chuyển | `/inventory/transfer` | Nghiệp vụ nâng cao | Restored | Route reused; no router change. |
| Kiểm kê | `/inventory/stock-take` | Nghiệp vụ nâng cao | Restored | Route reused; no router change. |
| Điều chỉnh | `/inventory/adjustments` | Nghiệp vụ nâng cao | Restored | Route reused; no router change. |
| Cảnh báo | `/inventory/alerts` | Nghiệp vụ nâng cao | Restored | Route reused; no router change. |
| Audit | `/inventory/audit` | Nghiệp vụ nâng cao | Restored, admin-only sidebar item | Route reused; sidebar item is visible only to admin-like roles or users with `admin.read` / `admin.write` / `*`. |
| Master Data | `/inventory/master-data` | Not restored | Retired | Still redirects to `/inventory/materials` after the prior materials/workspace consolidation. |

## What Changed

- Hidden operational pages were surfaced under a nested Inventory sidebar group.
- The group is collapsed by default and remembered per session.
- Active advanced routes auto-open the group so direct URL access remains navigable.
- Inventory breadcrumbs now identify advanced operation pages.
- Inventory Audit is flagged as an admin-only sidebar item using existing user role/permission fields.

## What Did Not Change

- No routes changed.
- No `AppRouter.tsx` route additions were required.
- No backend changes.
- No API changes.
- No Prisma schema changes.
- No migrations.

## Follow-Up Recommendation

If additional sidebar items require permission-specific visibility, extend the minimal `adminOnly` handling into a formal navigation permission policy in a focused RBAC/navigation sprint. Do not mix that with Inventory workflow changes.
