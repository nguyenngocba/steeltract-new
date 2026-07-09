# Inventory Command Validation Report

Date: 2026-07-09

## Controller Boundary

Inventory write endpoints now follow:

```text
Request
  -> ZodValidationPipe
  -> typed DTO
  -> InventoryService
  -> InventoryRepository
```

No `@Body() any` remains under `apps/backend-api/src/modules/inventory`.

## Transaction Validation

Required:

- transaction type;
- at least one transaction line or the legacy single-material form;
- non-zero finite quantity;
- material ID;
- for positive inbound lines: zone, slot, and level.

Validated optional line fields:

- unit;
- warehouse;
- zone;
- slot;
- level;
- unit price;
- total amount.

Compatibility:

- accepts Prisma types `IMPORT`, `EXPORT`, `TRANSFER`, `RETURN`, `ADJUSTMENT`;
- accepts frontend aliases `INBOUND`, `OUTBOUND`;
- preserves legacy `transactionNo`, supplier/project labels, invoice number,
  reference type, and single-material payload fields;
- response and numbering behavior are unchanged.

## Verification Cases

- Valid localized quantity `1,5`: accepted and normalized to `1.5`.
- Inbound with complete location: accepted.
- Inbound without location: rejected with the required Vietnamese message.
- Adjustment with partial location metadata: accepted as before.
- Existing 78 transaction lines: all have `unitPrice` and `totalAmount`.

One historical IMPORT line predates mandatory slot/level validation. It remains
an immutable audit record and was not rewritten. New writes through the active
Inventory transaction endpoint cannot create that condition.

