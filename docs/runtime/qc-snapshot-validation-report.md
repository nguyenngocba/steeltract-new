# QC Snapshot Validation Report

## Parity Coverage

`SnapshotValidatorService.validateQc` recalculates live values and compares:

- Dashboard counts, pass rate, open issues/NCR and waiting Production Orders.
- Inspection status, result count, issue count, NCR count and pass rate.

Missing rows produce `MISSING_SNAPSHOT`; value differences produce
`VALUE_MISMATCH`. Validation logs warnings and never repairs data.

Focused automated verification passed 5 suites and 14 tests, covering repository
calculation, event routing, writer transaction, Components regression and reader
fallback.

After migration, read-only database validation found zero persisted QC snapshot
rows and zero inspections. Live calculation returned one real completed
Production Order waiting for QC and an empty real trend. Missing snapshot status
is expected until a real event or rebuild occurs; no backfill was performed.

