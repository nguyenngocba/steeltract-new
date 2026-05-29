# INVENTORY TRANSACTION RULES

InventoryTransaction is the source of truth.

NEVER:
quantity += x

ALWAYS:
create InventoryTransaction

TRANSACTION TYPES:
- RECEIVE
- ISSUE
- TRANSFER
- RETURN
- RESERVE
- ADJUSTMENT
- CONSUME
- PRODUCTION_OUTPUT

RULES:
- all stock changes create transactions
- transactions are immutable
- stock quantity is cached snapshot only
- transactions drive audit logs
- transactions drive realtime updates

