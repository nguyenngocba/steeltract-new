# Module Layout Audit

| Module | Before UI001 | UI001 result |
|---|---|---|
| Inventory | Canon | Unchanged |
| Components | Shared primitives, repeated tab-page shell | Shared `ComponentsWorkspace` on all tabs |
| Production | Mature cockpit, local root/tab shell | Enterprise root/header/tabs |
| QC | Local root/header/tabs and KPI markup | Enterprise root/header/tabs and canonical KPI |
| Yard | Mature cockpit, local root/tab shell | Enterprise root/header/tabs |
| Projects | Mature cockpit, local root/tab shell | Enterprise root/header/tabs |
| Logistics | Mature cockpit, local root/tab shell | Enterprise root/header/tabs |
| Suppliers | Enterprise shell plus local header/tabs/KPI | Enterprise root/header/tabs and canonical KPI |
| Administration | Inventory-like pages with repeated roots/KPI | Enterprise roots and canonical KPI |

All active routes remain registered. No route, query key, API adapter,
permission, business workflow or backend file changed.
