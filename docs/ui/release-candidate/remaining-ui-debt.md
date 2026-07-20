# Remaining UI Debt

Date: 2026-07-18

Status: TRACKED

## P1

- Browser-based visual certification is still required for Inventory,
  Production, Components and QC.
- QC modal/detail shells should move to shared modal/drawer primitives.
- Cross-module status badges should be consolidated into a single shared
  status badge component.

## P2

- Older Inventory detail and transaction fragments still include local compact
  input classes.
- Some detail-page labels remain English while most operational pages use
  Vietnamese business language.
- Project-wide ESLint baseline still needs separate cleanup before it can be a
  hard release gate.

## Guardrail

Do not add fake statistics or placeholder operational values to make empty
states look busy. Truthful empty states are part of the release candidate
standard.

