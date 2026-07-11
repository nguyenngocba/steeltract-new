# Production Operations Center Report

## Status

**APPROVED**

Operations Center now includes Production Platform Health in the existing `/operations-center/overview` response.

## Health Blocks

The new `production` health block includes:

* Repository status
* Read Model status
* Snapshot status
* Feature flag status
* Event/outbox status
* Background job status
* Runtime tracking status
* Snapshot parity readiness
* Production entity counts

## Snapshot Modules

Operations Center snapshot module health now includes:

* Production
* Production Orders
* Work Centers

## Database Table Counts

Operations Center database table stats now include:

* `production_orders`
* `work_centers`
* `production_stages`

## Compatibility

This is an additive backend response change. No frontend UI was changed and no existing response fields were removed.
