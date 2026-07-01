# Watchers Remediation Plan

Date: 2026-06-27

## Goal

Prevent repeated local development crashes like:

```text
Error: ENOSPC: System limit for number of file watchers reached
```

## Immediate Recommendation

Raise Linux inotify limits for the development machine.

Recommended values:

```conf
fs.inotify.max_user_watches=1048576
fs.inotify.max_user_instances=2048
fs.inotify.max_queued_events=65536
```

Temporary commands:

```bash
sudo sysctl fs.inotify.max_user_watches=1048576
sudo sysctl fs.inotify.max_user_instances=2048
sudo sysctl fs.inotify.max_queued_events=65536
```

Persistent setup:

```bash
sudo nano /etc/sysctl.conf
sudo sysctl -p
```

Add these lines to `/etc/sysctl.conf`:

```conf
fs.inotify.max_user_watches=1048576
fs.inotify.max_user_instances=2048
fs.inotify.max_queued_events=65536
```

These commands were not executed by Codex. They require operator/admin action.

## Repo-Level Optimization Applied

Updated:

```text
apps/frontend/vite.config.ts
```

Added Vite watcher ignores:

```ts
server: {
  watch: {
    ignored: [
      '**/.git/**',
      '**/.turbo/**',
      '**/.semble-index/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.vite/**',
      '../../docs/**',
      '../../backups/**',
    ],
  },
},
```

Why this is safe:

- Source HMR under `apps/frontend/src` is not ignored.
- Static frontend source files remain watched.
- Ignored paths are generated artifacts, dependency folders, repository metadata, external docs, search indexes, and backups.

## Dev Process Guidance

Preferred local process set:

```bash
pnpm -C apps/backend-api start:dev
pnpm -C apps/frontend dev
```

Avoid running all of these simultaneously unless the inotify limits have been raised:

- VS Code Remote file watcher
- VS Code TypeScript tsserver
- Vite dev server
- Nest `start --watch`
- `tsx watch` from `apps/backend-experimental`
- multiple AI/code assistants with workspace indexing enabled
- multiple terminals running duplicate dev servers

## Duplicate Watcher Checks

Use:

```bash
ps -ef | grep -E 'vite|node|tsx|pnpm' | grep -v grep
```

Look for duplicates:

- Multiple `vite` processes for the same `apps/frontend` workspace.
- Multiple `nest start --watch` processes for `apps/backend-api`.
- `tsx watch src/server.ts` from `apps/backend-experimental` running when not actively needed.

Do not kill processes blindly. Stop the matching terminal/session intentionally.

## Optional VS Code Settings

If watcher pressure continues after raising sysctl limits, consider adding workspace-level excludes in VS Code settings:

```json
{
  "files.watcherExclude": {
    "**/.git/**": true,
    "**/.turbo/**": true,
    "**/.semble-index/**": true,
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/coverage/**": true,
    "**/backups/**": true
  }
}
```

This is intentionally not applied automatically because it is an editor preference.

## Future Improvements

- Add a documented `dev:frontend` and `dev:backend` workflow if the team wants root-level scripts.
- Avoid starting `apps/backend-experimental` watch during normal ERP/MES development unless explicitly testing that app.
- Consider route-level frontend code splitting for large 3D/Yard bundles, but this is separate from inotify exhaustion.

## Validation

After remediation:

```bash
cat /proc/sys/fs/inotify/max_user_watches
cat /proc/sys/fs/inotify/max_user_instances
cat /proc/sys/fs/inotify/max_queued_events
pnpm -C apps/frontend dev
pnpm -C apps/backend-api start:dev
```

Expected:

- Vite starts without ENOSPC.
- Backend watch starts without ENOSPC.
- HMR continues to work for edits under `apps/frontend/src`.
