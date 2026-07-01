# Project Template Rule Engine Report

Date: 2026-07-01

## Implementation

- No Prisma migration was added.
- Template rules are stored in the existing `ProjectTemplate.structure` JSON domain.
- The frontend rule engine reads:
  - `structure.rules` when present
  - derived rules from `structure.tasks` when explicit rules are absent

## Rule Fields

- `taskType`
- `defaultDuration`
- `suggestedMaterials`
- `suggestedComponents`
- `suggestedResources`
- `suggestedMachines`
- `suggestedChecklist`

## UI

- Task Create modal now uses `Tự đề xuất`.
- Suggestions are template-driven, not hardcoded.

## Remaining Work

- Add a visual admin editor for task rules inside the Template workspace.
