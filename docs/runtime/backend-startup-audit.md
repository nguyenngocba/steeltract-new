# Backend Startup Audit

Date: 2026-07-08

## Scope

Audit the backend startup failure:

```text
Error: Cannot find module '/opt/projects/steeltrack/apps/backend-api/dist/main'
```

This audit covered:

* `apps/backend-api/package.json`
* `apps/backend-api/nest-cli.json`
* `apps/backend-api/tsconfig.json`
* `apps/backend-api/tsconfig.build.json`
* Nest build output under `apps/backend-api/dist`
* backend start scripts

## Findings

### Scripts

The backend package scripts were already conceptually correct:

```json
"build": "nest build",
"start": "nest start",
"start:dev": "nest start --watch",
"start:prod": "node dist/main"
```

`start:prod` expects `dist/main.js`.

### Nest CLI

`nest-cli.json` uses:

```json
"sourceRoot": "src",
"deleteOutDir": true
```

With this configuration, the production build should emit `src/main.ts` to `dist/main.js`.

### TypeScript Build Configuration

`tsconfig.json` included both application source and Prisma support scripts:

```json
"include": [
  "src/**/*.ts",
  "prisma/**/*.ts"
]
```

Before the fix, `tsconfig.build.json` extended this include list. Because both `src/**/*.ts` and `prisma/**/*.ts` were in the build program, TypeScript inferred the project root as the common source root and emitted:

```text
dist/src/main.js
dist/prisma/seed.js
```

instead of:

```text
dist/main.js
```

## Root Cause

The startup failure was caused by a build layout mismatch:

```text
start:prod -> node dist/main
build output -> dist/src/main.js
```

The mismatch came from `tsconfig.build.json` inheriting the root `include` list from `tsconfig.json`, especially `prisma/**/*.ts`.

There was a second hardening issue: the inherited incremental build setting could leave stale TypeScript build metadata while Nest deletes `dist`, causing incomplete output after the build layout was changed. The build config now disables incremental compilation for backend production builds.

## Rejected Fixes

The following were intentionally not used:

* Copying `dist/src/main.js` to `dist/main.js`.
* Creating a symlink from `dist/main.js` to `dist/src/main.js`.
* Changing `start:prod` to point at `dist/src/main.js`.

Those approaches would hide the mismatch instead of fixing the build layout.

## Corrective Direction

The sustainable fix is to make the backend build compile only application source with an explicit build root:

```text
rootDir: ./src
include: src/**/*.ts
exclude: prisma
incremental: false
```

This makes `nest build` emit `dist/main.js`, which matches the existing production start script.
