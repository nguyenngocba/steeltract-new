# Material Command Standard

Date: 2026-07-11

## Production Commands

The canonical internal Production contracts are:

* `ReserveMaterialCommand`
* `ReleaseMaterialCommand`
* `IssueMaterialCommand`
* `ConsumeMaterialCommand`
* `ReturnMaterialCommand`

They identify the Production Order, source business record, actor, and material
quantities. They do not contain raw Prisma operations.

## Inventory Posting Commands

`InventoryPostingService` accepts Inventory-owned Issue and Return posting
commands plus the shared transaction context. Quantities in commands are
positive business quantities; Inventory decides the persisted sign:

* Issue -> negative `EXPORT` transaction line.
* Return -> positive `RETURN` transaction line.

Production must not calculate or directly persist Inventory balances.

## Reservation Semantics

Creating a Draft Reservation records demand only and does not write a `RESERVE`
ledger row. The `RESERVE` ledger event is written once when the reservation is
actually allocated and changes to `RESERVED`. Release/expiry writes `RELEASE`.

## Consumption And Scrap

`CONSUME` ledger rows contain consumed quantity only. Existing scrap input and
persistence remain compatible, but Scrap does not contribute to a `CONSUME`
ledger quantity. A future Scrap workflow must use its own command/event/ledger
semantic.
