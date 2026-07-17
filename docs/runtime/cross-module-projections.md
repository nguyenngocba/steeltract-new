# Cross-module Projections

| Projection | Publishers | Result |
| --- | --- | --- |
| `ProductionMaterialStatus` | Production | Latest material-flow facts |
| `ProductionVsInventory` | Production, Inventory | Separate production and inventory event sides |
| `ComponentUsage` | Production | Component scope by production order |
| `OpenReservations` | Production | Open/closed reservation state |
| `ReleasedComponentCatalog` | Components | Release eligibility catalog |

These are query-side joins by emitted identifiers. They do not issue commands,
mutate another bounded context or transfer ownership. Missing identifiers remain
missing rather than being inferred.

Cross-module convergence follows eventual consistency and each document exposes
its source event name and occurrence time for diagnostics.
