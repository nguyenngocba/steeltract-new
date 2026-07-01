# Watchers Diagnostics Report

Date: 2026-06-27

Issue:

```text
Error: ENOSPC: System limit for number of file watchers reached
```

This is Linux inotify watcher exhaustion, not disk space exhaustion.

## Kernel Limits

Current values:

```text
fs.inotify.max_user_watches = 116843
fs.inotify.max_user_instances = 128
fs.inotify.max_queued_events = 16384
```

These values are low for the current SteelTrack development shape: a Vite frontend, Nest watch backend, VS Code Remote, TypeScript language servers, and multiple AI/code assistant indexers.

## Running Watcher Consumers

Snapshot command:

```bash
ps -ef | grep -E 'vite|node|tsx|pnpm' | grep -v grep
```

Relevant processes observed:

| PID | Process | Notes |
| --- | --- | --- |
| 1325427 | VS Code extensionHost | Workspace extension host; high CPU and memory during diagnostics |
| 1325438 | VS Code fileWatcher | Dedicated VS Code remote file watcher |
| 1325521 / 1325527 | TypeScript tsserver | VS Code TypeScript language services |
| 1325536 | OpenAI Codex app-server | AI-assisted coding session |
| 1325937 | Codeium language server | Workspace index/search service |
| 1325947 | Google Gemini Code Assist / Cloud Code | Additional AI/code assistant process |
| 1330728 | Nest CLI `start --watch` | Backend watch process |
| 1330851 | Backend runtime from watch build | Running backend process |

No active Vite process was present in this snapshot. That means the observed environment was already consuming watchers before starting the frontend dev server.

## Inotify FD Snapshot

Command:

```bash
find /proc/*/fd -lname anon_inode:inotify 2>/dev/null | sed 's#/proc/##; s#/fd/.*##' | sort | uniq -c | sort -nr | head -30
```

Top inotify file descriptor holders:

```text
5 1
4 891334
3 1915
2 1325947
2 1325937
2 1325536
1 1330728
1 1325438
1 1325427
```

Command:

```bash
lsof | grep inotify | awk '{count[$1":"$2]++} END {for (p in count) print count[p], p}' | sort -nr | head -30
```

Top reported inotify entries:

```text
56 agy:891334
50 codex:1325536
34 language_:1325937
22 cloudcode:1325947
13 node:1325438
12 node:1325427
11 node:1330728
```

## Repository Shape

Observed development artifact directories:

```text
./apps/frontend/node_modules
./apps/frontend/dist
./apps/backend-api/node_modules
./apps/backend-api/dist
./apps/backend-experimental/node_modules
./docs
./.semble-index/docs
./node_modules
```

Approximate active source/docs file counts:

```text
apps/frontend/src files: 2071
apps/backend-api/src files: 215
docs files: 59
```

## Script Audit

Root `package.json` does not define a recursive dev script.

Frontend:

```json
"dev": "vite"
```

Backend API:

```json
"start:dev": "nest start --watch"
```

Backend experimental:

```json
"dev": "tsx watch src/server.ts"
```

Current running watcher process is the backend API Nest watch. No duplicate Vite process was observed during diagnostics.

## Estimated Cause

Primary cause:

- Kernel inotify limits are too low for the development environment.

Contributing factors:

- VS Code Remote file watcher and TypeScript server are active.
- Multiple AI/code-assistant indexers are running at the same time.
- Backend Nest watch is active.
- Starting Vite adds another watcher tree over `apps/frontend`.
- Build/cache/index directories exist in the workspace (`dist`, `.vite`, `.semble-index`, `node_modules`, `docs`) and should be ignored where safe.

## Diagnosis

The frontend ENOSPC crash is most likely caused by combined watcher pressure, not a single SteelTrack source file. The example path under `apps/frontend/src/modules/yard/live-tracking/events/YardMovementEvents.ts` is simply the file Vite/Chokidar was trying to watch when the kernel limit was reached.
