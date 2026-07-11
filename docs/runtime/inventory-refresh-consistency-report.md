# Inventory Refresh Consistency Report

Date: 2026-07-10

Status: PASS WITH SNAPSHOT DELAY NOTE

## Expected Flow

For transaction workspaces:

`Mutation success -> Query invalidation -> Active query refetch -> UI shows new rows/balances`

For Inventory Overview:

`Mutation success -> Query invalidation -> Background snapshot update -> 5s mounted refetch -> Overview catches fresh snapshot`

## Workspace Consistency

| Surface | Expected after mutation | Result |
|---|---|---|
| Transaction History | New transaction appears without F5 | Covered by `['inventory-transactions']` and `['inventory']` invalidation |
| Material Detail | Current stock/history refetches | Covered by `['material-detail']` and `['inventory']` invalidation |
| Materials list | Current page/filter refetches | Covered by `['inventory']` invalidation |
| Locations | Location balances refetch | Covered by `['inventory-zones']` and `['inventory-zone-detail']` invalidation |
| Return Requests | Requested/received/rejected state refetches | Covered by `['inventory-return-requests']` invalidation |

## Dashboard / Overview Consistency

Inventory Overview is snapshot-first. It is allowed to be eventually consistent because snapshots are updated by the Background Engine. The frontend now performs a 5-second mounted refetch for the Overview read model so a completed snapshot update is picked up without user reload. While the Overview query is refetching in the background, the refresh control shows `Đang đồng bộ...` instead of implying the dashboard is already final.

No direct snapshot writes were added to HTTP mutation requests.

## Remaining Operational Note

If the Background Engine worker is not running, Overview may continue to show the previous snapshot while transaction/detail/location workspaces show fresh repository-backed data. That is expected under the frozen architecture and should be monitored through Operations Center snapshot lag.
