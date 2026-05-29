# STEELTRACK ARCHITECTURE FREEZE

STATUS:
ACTIVE

GOALS:
- stabilize architecture
- consolidate runtime systems
- remove duplicate abstractions
- standardize workflows
- standardize events
- standardize transactions

CORE PRINCIPLES:
- Modular Monolith
- Domain Driven
- Transaction Based Inventory
- Event Driven
- Realtime Ready
- Workflow Oriented

STRICT RULES:
- no duplicate runtimes
- no duplicate workspace systems
- no direct prisma usage in controllers
- no giant components
- no experimental abstractions in core

OFFICIAL FRONTEND ROOTS:
- core/
- shared/
- modules/
- infrastructure/

OFFICIAL BACKEND ROOTS:
- modules/
- core/
- shared/

DEPRECATED:
- cockpit-runtime
- workspace-runtime
- telemetry-runtime
- duplicated engine layers

