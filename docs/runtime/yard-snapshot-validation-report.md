# EPIC163 - Yard Snapshot Validation Report

`SnapshotValidatorService.validateYard()` performs warning-only parity checks.

Dashboard fields checked:

- zone/slot/placement counts;
- available and occupied capacity;
- total weight;
- movement today/month;
- overloaded zones;
- crane total/availability.

Workspace fields checked globally and per zone:

- total/occupied/available slots;
- placement count;
- total weight.

Missing rows and mismatches produce runtime warnings. The validator never
updates or repairs data. `SnapshotRebuilder` invokes this validator after a Yard
write.

Automated verification covers repository reads/upserts, writer transaction,
event routing and fallback enqueue. No production-like snapshot parity claim is
made until the migration is deployed and real Yard events are processed.

