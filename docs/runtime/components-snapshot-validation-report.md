# Components Snapshot Validation Report

Date: 2026-07-12

## Validator Coverage

Dashboard parity compares:

- total, stock, producing, ready, shipped, delivered and installed counts;
- total estimated cost;
- total actual cost.

Summary parity compares:

- status;
- Production Order count;
- Timeline count;
- estimated and actual cost;
- current location.

Missing rows produce `MISSING_SNAPSHOT`; differences produce `VALUE_MISMATCH`.
Validation logs warnings and never updates or repairs business data.

## Verification Evidence

- Prisma schema validation: PASS.
- Prisma Client generation: PASS.
- additive migration deploy: PASS.
- snapshot repository calculation test: PASS.
- snapshot reader fallback/enqueue test: PASS.
- snapshot writer transaction/routing test: PASS.
- real-data calculation: PASS with no persisted fake rows.

