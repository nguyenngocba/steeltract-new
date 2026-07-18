# Production Implemented Pages

| Route | Source | State |
| --- | --- | --- |
| `/production` | Cockpit live read model | Implemented |
| `/production/orders` | Cockpit live read model | Implemented |
| `/production/planning` | Cockpit live read model | Implemented |
| `/production/boms` | Production BOM API | Implemented |
| `/production/warehouse` | Existing Inventory/Production queries | Implemented |
| `/production/execution` | Existing execution queries | Implemented |
| `/production/reservations` | Reservation API | Implemented |
| `/production/material-ledger` | Material ledger API | Implemented |
| `/production/material-issues` | Material issue API | Implemented |
| `/production/consumptions` | Consumption API | Implemented |
| `/production/logs` | Production log API | Implemented |
| `/production/incidents` | No approved workflow/API | Truthful empty state |
| `/production/reports` | No approved reporting contract | Truthful empty state |

UI005 did not create fake data, inactive actions or new backend dependencies to
make unavailable pages appear complete.
