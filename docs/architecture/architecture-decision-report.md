# ADS001 Architecture Decision Report

Date: 2026-07-17  
Status: **APPROVED**

## Decision

SteelTrack adopts explicit bounded-context ownership for Inventory, Components,
Production, QC, Projects, Yard, Suppliers and Logistics.

For every business capability:

- one aggregate/context owns state and invariants;
- only the owner exposes mutation commands;
- only the owner publishes the authoritative fact;
- the owner publishes query contracts for source truth;
- consumers build local projections or subscribe to events;
- foreign table and repository writes are forbidden.

## Key Ownership Decisions

1. Inventory exclusively owns stock, valuation and location balances.
2. Production owns material reservation, issue intent, consumption, production
   return intent, production completion, scrap and rework execution.
3. Inventory executes the stock subcommand for Production Issue/Return and
   publishes the resulting Inventory fact.
4. Components owns identity and future revision/released engineering definition,
   not Production execution or material ledger.
5. QC exclusively owns inspection result and NCR.
6. Projects owns demand/allocation and site acceptance, not stock or delivery.
7. Yard owns physical placement/movement/loading execution.
8. Logistics owns loading plan, dispatch, shipment and delivery proof.
9. Suppliers owns commercial source documents, not receipt stock or inspection.

## Transaction Decision

Owner-exported application services may collaborate in one local PostgreSQL
transaction when an invariant requires atomicity. This does not permit direct
foreign repository access. Each owner validates/writes its own tables and
Outbox. Distributed workflows use events and idempotent consumers.

## Superseded Guidance

ADS001 supersedes earlier documentation that labels direct foreign repository
writes as `Allowed`. Such paths are compatibility debt. The allowed mechanism is
an owner-exported command boundary.

## Consequences

### Positive

- No duplicate Inventory, Production, QC or Component truth.
- State machines can be specified without cross-module ambiguity.
- Events have one authoritative publisher.
- Read models can scale independently without becoming write models.
- Future extraction from the modular monolith remains possible.

### Cost

- Existing direct Component writes need command-boundary remediation.
- Some cross-schema read joins need stable query contracts/projections.
- Component status must be split into owned lifecycle and external projections.
- Event payload/version contracts still require ADS004.

## Follow-up Gates

1. **ADS002**: Component State Machine using this ownership matrix.
2. **ADS003**: Production State Machine and Work Order/completion alignment.
3. **ADS004**: Versioned Cross-module Event Contracts.
4. Only then begin module implementation sprints.

## Non-actions

ADS001 changes no code, API, schema, migration, data or runtime behavior. It is
a normative target; current implementation gaps remain explicitly tracked.

