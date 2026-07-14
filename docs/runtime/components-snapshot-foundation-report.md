# Components Snapshot Foundation Report

Date: 2026-07-12

## Status

Components Snapshot Foundation: **APPROVED**.

EPIC143 extends the existing SteelTrack Snapshot Engine; it does not introduce a
Components-specific framework. Workspace List/History/Detail/Costing remain on
repository live reads under ADR011.

## Persisted Models

`ComponentDashboardSnapshot` is keyed by `scopeKey + snapshotDate` and stores
domain dashboard counts, estimated/actual cost totals, and an extensible payload.

`ComponentSummarySnapshot` is keyed by `componentId` and stores lifecycle status,
project reference, Production/Timeline counts, costs, current location and a
domain payload. It is reusable by dashboard analytics, Production, QC, Yard,
Projects and future Operations Center integration; it is not screen-specific.

Migration `20260712120000_component_snapshot_foundation` is additive and was
successfully deployed. No existing row was rewritten or deleted.

## Core Integration

- `ComponentSnapshotRepository`: calculate/read/upsert dashboard and summaries.
- `SnapshotWriterService`: Background Engine branch for `components`.
- `SnapshotReaderService`: dashboard/history/summary readers.
- `SnapshotValidatorService`: live-vs-persisted parity checks.
- `SnapshotRebuilder`: Components validation after rebuild.
- `SnapshotFeatureFlagService`: `USE_COMPONENTS_SNAPSHOT` and max-age support.
- `SnapshotUpdateDispatcher`: Components scope and `componentId` idempotency.

## Data Evidence

After migration, a read-only calculation on current data produced one dashboard
row and one summary candidate. Persisted snapshot tables remained empty, proving
that EPIC143 did not create fake or automatic backfill data.

