# Project Detail Snapshot Parity Report

Date: 2026-07-08

## Objective

Validate Project Detail persisted snapshots against repository-backed read-model output per project and tab.

## Validator

New validator:

`SnapshotValidatorService.validateProjectDetails(projectId?, tab?)`

Comparison:

* Recalculate tab payloads through `ProjectSnapshotRepository.calculateDetailSnapshots()`.
* Load persisted row through `ProjectSnapshotRepository.findDetail()`.
* Emit warning when:
  * snapshot row is missing;
  * snapshot payload differs from repository read-model payload.

## Behavior

The validator is intentionally non-mutating:

* It does not repair snapshots.
* It does not overwrite snapshot payloads.
* It does not fail user requests.
* It logs warnings for Operations Center and runtime follow-up.

## Warning Types

* `MISSING_SNAPSHOT`
* `VALUE_MISMATCH`

## Operational Meaning

Parity warnings mean the persisted snapshot is not aligned with the canonical repository-backed read model. Operators should trigger or wait for a background rebuild before relying on snapshot-only reads.

## Acceptance Status

Project Detail parity foundation is implemented.

Runtime parity should be sampled after operators exercise:

* Project task create/update/delete.
* Project material allocation changes.
* Project component allocation changes.
* Project cost updates.
* Project inspection/progress updates.
* Project document/log creation.
