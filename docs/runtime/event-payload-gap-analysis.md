# Canonical Event Payload Gap Analysis

## Completed Producers

### Inventory

New canonical stock facts include transaction id/code, material, quantity, unit,
separate warehouse/zone/slot/level, reference, posting kind/time, resulting
material stock and resulting location balance. Transfer facts keep separate
source and destination objects. Stocktake completion now includes scope and
line/variance counts.

Canonical stock events are emitted only when real unit and warehouse facts are
available. Missing legacy location/unit data is not replaced with defaults.

### Production

Order events now include title, project, quantity and unit. Work-order events
include number, product and quantity. Completion, Scrap and Rework payloads now
include resulting state and lifecycle facts. Material events include typed state
and a deterministic source aggregate token.

### Components

Identity events now carry resulting name, description, project and current
revision. Revision events always carry BOM id and content hash when present.

### QC and Yard

QC inspection and NCR producers now publish lightweight canonical facts rather
than Prisma graphs and include AD-019 envelopes. Yard placement/movement events
also publish bounded facts and complete envelopes.

## Remaining Gaps

| Domain/event | Missing fact | Reason |
| --- | --- | --- |
| Inventory historical stock events | quantity, unit, resulting balances | Existing retained compatibility payloads predate RFC002A |
| Inventory locationless legacy writes | warehouse/unit | Source record does not contain the fact; emission is skipped |
| Production execution family | all facts | No approved publisher path exists |
| Production issue status | cumulative resulting Production material balance on every issue path | Current command owns event delta but not a normalized cumulative material projection |
| QC NCR | defect/reason codes | Current NCR model has free text/disposition but no canonical code fields; payload uses explicit null |
| QC disposition | all facts | No disposition-completed publisher exists |
| Yard move source | source zone and stack level | Current placement read returns only prior slot id for the latest movement |
| Yard loading | all facts | No loading-completed workflow/publisher exists |
| Projects canonical events | all facts | No canonical publisher found |
| Logistics canonical events | all facts | No canonical publisher found |

No absent event, domain field or workflow was invented to close these gaps.
