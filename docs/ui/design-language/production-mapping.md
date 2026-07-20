# Production Design Mapping

Status: IMPLEMENTED

## Inventory To Production

Inventory's "stock state" maps to Production's "execution state".

- Inventory value KPI -> Production output/load KPI.
- Low/out stock KPI -> waiting material and delayed production KPIs.
- Inventory quick actions -> production create/order/BOM execution shortcuts.
- Inventory stock table -> Production Order / Work Order table.
- Inventory distribution charts -> production progress, material readiness and
  stage distribution.
- Inventory recent transactions -> Production activity log.

## Changes Applied

Production Overview now places a quick operational summary before the main
order table. The summary uses existing read-model fields only:

- Completed today.
- Waiting material.
- Delayed orders.
- Quick execution actions.

The lower quick-action card was replaced with recent production activity. This
better follows Inventory: the top area is for actions, the lower area is for
supporting context.

## Reasoning

Production previously had the right components but felt less mature because the
workflow emphasis was inverted: actions and supporting information were not in
the same rhythm as Inventory. Moving compact action/status cards above the
table makes Production read as "Inventory for Manufacturing" without copying
Inventory-specific code or data.

No backend, API, React Query, DTO, route, permission or business behavior was
changed.

