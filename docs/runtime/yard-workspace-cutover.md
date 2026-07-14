# EPIC162 - Yard Workspace Cutover

## Read Path

`YardPage -> useYardWorkspace -> /yard/read-model/workspace -> YardReadModelService -> YardReadModelRepository -> Prisma`

The active page no longer launches five independent zone/slot/metrics/movement/
crane queries. Mutation invalidation still uses the existing `['yard']` prefix,
so the live workspace refetches after existing Yard commands.

## Workspace Coverage

| Workspace | Live read-model source | Result |
| --- | --- | --- |
| Overview | summary + analytics + bounded map/recent rows | PASS |
| Map 2D/3D | real bounded zone/slot/placement rows | PASS |
| Locations/components | paginated slot page with active placements | PASS |
| Transfers/operations | server movement totals plus bounded recent rows | PASS |
| History | server item/location/date/type filters and pagination | PASS |
| QC queue | latest persisted inspection per visible Component | PASS |

The 3D map now renders an explicit empty state when no real slots exist. All
`DEMO-*` source rows were removed. The unused synthetic QC row-index logic no
longer creates statuses; the live read model exposes only persisted QC status.

Layout, styling, route and mutation workflow are unchanged.

