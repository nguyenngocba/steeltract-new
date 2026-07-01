# Project Baseline Report

Date: 2026-06-30

## Implemented

Project WBS task metadata now supports:

- `baselineStartAt`
- `baselineFinishAt`
- baseline variance days

The scheduling read model returns `baselineVarianceDays` by comparing baseline finish against scheduled finish.

## Frontend

Task editor includes baseline start/finish inputs.

Task detail displays:

- Baseline range
- Current scheduled range
- Baseline variance

## Limitations

- Baselines are still metadata-backed.
- Formal baseline approval, versioning, and lock/unlock workflow require normalized ProjectTask schedule tables.

