# Business Data Cleanup - 2026-06-24

## Purpose

Reset real/demo business data so operators can recreate clean records manually.

## Backup

- Backup created before cleanup: `backups/steeltrack_before_business_data_cleanup_20260624_092729.dump`
- Cleanup script executed: `scripts/sql/business-data-cleanup-20260624.sql`

## Cleared Data

- Inventory materials, transactions, transaction items, return requests, and location stock balances.
- Components, component timelines, component costing, and component tasks.
- Projects.
- Suppliers and supplier scores.
- Purchase orders, purchase receiving, and material requests.
- Production BOMs, production orders, reservations, issues, consumptions, ledgers, stages, tasks, schedules, logs, and legacy work orders.
- QC runtime records: inspections, results, issues, NCRs, and QC attachments.
- Yard operational records: placements, movements, and snapshots.
- Logistics transport master rows currently represented by `vehicles`.
- Attachments metadata and attachment versions/links for deleted business entities.
- Runtime noise: notifications, activity logs, analytics snapshots/metrics/alerts/predictions, workflow instances/actions, outbox events, and background jobs.

## Preserved Data

- Users, roles, permissions, and refresh tokens.
- Inventory categories, material types, master units, transaction types, warehouses, and warehouse zones.
- Yard layout configuration: zones, rows, slots, and cranes.
- QC checklist templates and checklist items.
- Workflow definitions and steps.
- Work centers and machines.
- Master/system configuration tables.

## Verification

Post-cleanup counts:

| Area | Table | Count |
| --- | --- | ---: |
| Materials | `inventory_items` | 0 |
| Inventory transactions | `inventory_transactions` | 0 |
| Inventory balances | `inventory_location_stocks` | 0 |
| Components | `components` | 0 |
| Projects | `projects` | 0 |
| Suppliers | `Supplier` | 0 |
| Vehicles | `vehicles` | 0 |
| BOM | `BOM` | 0 |
| Production orders | `production_orders` | 0 |
| Production issues | `ProductionMaterialIssue` | 0 |
| QC inspections | `qc_inspections` | 0 |
| Yard placements | `yard_item_placements` | 0 |
| Yard movements | `yard_movements` | 0 |
| Attachments | `attachments` | 0 |
| Notifications | `notifications` | 0 |

Preserved reference/config counts:

| Area | Table | Count |
| --- | --- | ---: |
| Categories | `inventory_categories` | 13 |
| Material types | `material_types` | 27 |
| Units | `master_units` | 15 |
| Warehouses | `master_warehouses` | 2 |
| Warehouse zones | `warehouse_zones` | 13 |
| Yard slots | `yard_slots` | 93 |
| QC checklists | `qc_checklists` | 2 |
| Users | `users` | 1 |
| Roles | `roles` | 1 |

Yard slots were reset to `AVAILABLE`; `currentStackLevel = 0` for all 93 slots.

## Notes

- SQL cleanup does not delete physical files under `/data/steeltrack-storage`; it deletes attachment metadata from the database. Physical storage cleanup can be performed separately if required.
- No Prisma schema, API, or application code changes were made.
