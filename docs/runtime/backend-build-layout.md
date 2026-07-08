# Backend Build Layout

Date: 2026-07-08

## Before

The backend build emitted the application entry point under `dist/src`:

```text
apps/backend-api/dist/src/main.js
apps/backend-api/dist/prisma/seed.js
```

The expected production entry point did not exist:

```text
apps/backend-api/dist/main.js
```

This caused:

```text
node dist/main
Cannot find module '.../apps/backend-api/dist/main'
```

## After

`apps/backend-api/tsconfig.build.json` now constrains production build input to the Nest application source:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "incremental": false,
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "test", "dist", "prisma", "**/*spec.ts"]
}
```

The verified build layout is:

```text
apps/backend-api/dist/main.js
```

The following incorrect production-build artifacts are no longer emitted:

```text
apps/backend-api/dist/src/main.js
apps/backend-api/dist/prisma/seed.js
```

## Verification Evidence

After `pnpm -C apps/backend-api build`:

```text
dist-main-ok
no-dist-src-main
no-dist-prisma-seed
```

## Why This Is Correct

The Nest CLI `sourceRoot` is `src`, and the production entry file is `src/main.ts`.

The production runtime script is:

```text
node dist/main
```

Therefore the correct build output is:

```text
dist/main.js
```

The backend build now matches the runtime script without copy, move, or symlink workarounds.
