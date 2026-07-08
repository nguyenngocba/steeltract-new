# Backend Startup Fix Report

Date: 2026-07-08

## Problem

Backend startup failed with:

```text
Cannot find module '/opt/projects/steeltrack/apps/backend-api/dist/main'
```

## Exact Cause

`tsconfig.build.json` inherited the root TypeScript include list:

```json
"include": [
  "src/**/*.ts",
  "prisma/**/*.ts"
]
```

That caused TypeScript to preserve `src/` in output and place the entry point at:

```text
dist/src/main.js
```

The production script expected:

```text
dist/main.js
```

## Fix Applied

Updated `apps/backend-api/tsconfig.build.json` so backend production builds:

* compile only `src/**/*.ts`;
* exclude `prisma`;
* use `rootDir: ./src`;
* disable incremental output for clean Nest builds.

## Why It Failed Before

The script was not the primary issue. `node dist/main` is the correct production start command for this Nest application. The build output was wrong because the build program included Prisma scripts outside `src`, shifting TypeScript's inferred root directory.

## Why It Is Correct Now

`nest build` now emits:

```text
dist/main.js
```

and does not emit:

```text
dist/src/main.js
dist/prisma/seed.js
```

## Startup Verification

The following scripts were verified:

```bash
pnpm -C apps/backend-api start:prod
pnpm -C apps/backend-api start
pnpm -C apps/backend-api start:dev
```

All three reached:

```text
Nest application successfully started
```

The commands were run under `timeout` because backend server scripts are long-running. The resulting exit code `124` is expected from the test harness after successful bootstrap and is not a startup failure.

## Project Snapshot Note

Project Detail snapshot scope was tightened in EPIC116.1:

* Snapshot-backed tabs: `overview`, `materials`, `components`, `progress`, `command`, `site`, `costs`.
* Non-summary tabs such as `documents` and `logs` remain repository read-model fallback paths.

This avoids creating a separate persisted snapshot for every screen and keeps snapshots focused on reusable Project execution summaries.

## Result

Backend startup hardening: PASS.

No copy/move/symlink workaround was used.
