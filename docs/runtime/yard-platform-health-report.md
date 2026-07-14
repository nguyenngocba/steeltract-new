# Yard Platform Health Report

## Status

Yard Platform Health integration: **PASS**.

The existing Operations Center overview now returns an additive `yard` health
section covering:

| Area | Source |
| --- | --- |
| Repository | EPIC161 boundary certification |
| Read model | Yard live-read counter and fallback counter |
| Snapshot | Dashboard/workspace row counts, latest timestamp, age, hit ratio and lag |
| Feature flag | `USE_YARD_SNAPSHOT` through the shared flag service |
| Background | `snapshot.yard*` active/failed jobs |
| Events | `yard.*` pending/failed Outbox rows |
| Parity | Existing warning-only Yard validator capability |
| Domain | Zone, slot, active placement and movement counts |

Missing snapshot rows are reported as `critical`; no activity is reported as
unknown/zero rather than being treated as proof of health. Event coverage stays
`partial` because reservation, hold, loading and dispatch workflows do not yet
exist. No Operations Center UI was changed.
