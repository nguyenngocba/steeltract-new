# SteelTrack Bounded Context Map

Date: 2026-07-17  
Status: **APPROVED - ADS001**

## Value Stream

```text
Suppliers -> Inventory -> Production -> QC -> Yard -> Logistics -> Projects
                       ^        |
                       |        v
                    Components (identity/revision/BOM definition)
```

Projects supplies demand and allocation. Components defines what is fabricated.
Production decides how and records execution. Inventory owns material stock. QC
owns acceptance evidence. Yard owns physical finished-goods placement.
Logistics owns transport. Suppliers owns commercial source documents.

## Context Responsibilities

| Context | Owns | Does not own |
| --- | --- | --- |
| Inventory | Material master, stock transaction, valuation, location balance, adjustment, stock take, receipt/posting | Production intent, Project allocation, QC result, Yard placement |
| Components | Component identity, revision, released engineering definition and handoff lifecycle | Production stages, material ledger, QC result, Yard/Logistics state |
| Production | Work/Production Orders, routing execution, reservation, issue intent, consumption, production return intent, completion, scrap/rework execution | Inventory stock, QC result, Component revision |
| QC | Inspection, result, evidence, NCR and rework request | Production execution, Component lifecycle, stock |
| Projects | Project/WBS, material/component allocation, site return intent, installation acceptance | Stock, Production execution, transport proof |
| Yard | Topology, slot capacity, allocation, placement, movement and physical loading | Component identity, QC result, Dispatch lifecycle |
| Suppliers | Supplier identity, sourcing/commercial documents, supplier return intent/performance | Inventory receipt, QC result, delivery transport |
| Logistics | Loading plan, dispatch, shipment, route and delivery proof | Yard physical placement, Project acceptance, Inventory ledger |

## Relationship Types

- **Owner-exported command**: synchronous request to mutate the owner's
  aggregate; allowed only through an application service.
- **Published fact**: Outbox event consumed asynchronously.
- **Published query**: owner API/read-model contract.
- **Local projection**: consumer-owned read model built from published facts.
- **Forbidden**: foreign table/repository write or duplicated ledger.

## Dependency Direction

Inventory is independent of higher-level workflow semantics. It accepts posting
commands with references but does not import Production/Project/Supplier rules.
Components is independent of execution details. Production references released
Component/BOM versions. QC, Yard, Logistics and Projects advance their own
aggregates in sequence through facts and commands, never by editing one shared
status column as a workflow bus.

## Read Composition

Cross-context Cockpits may compose owner APIs or local projections. Dashboard
analytics use snapshots. Operator workspaces use live owner read models under
ADR011. Direct cross-schema joins are not a command boundary and should be
replaced when they become operational dependencies.

