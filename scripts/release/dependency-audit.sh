#!/usr/bin/env bash
set -euo pipefail

audit_json="$(corepack pnpm audit --prod --json 2>/dev/null || true)"
test -n "$audit_json"

if jq -e '.error != null or (.advisories | type) != "object"' >/dev/null <<<"$audit_json"; then
  printf 'Production dependency audit did not return a valid advisory report.\n' >&2
  exit 2
fi

findings="$(jq -r '
  [.advisories[]
    | select(.severity == "critical" or .severity == "high")
    | . as $advisory
    | .findings[].paths[]
    | select(
        startswith("apps__backend-api>") or
        startswith("apps__frontend>") or
        startswith("packageManagerDependencies>")
      )
    | [$advisory.severity, $advisory.module_name, $advisory.github_advisory_id, .]
    | @tsv
  ] | unique[]
' <<<"$audit_json")"

if [[ -n "$findings" ]]; then
  printf '%s\n' "$findings"
  printf 'Production dependency gate failed.\n' >&2
  exit 1
fi

printf 'critical=0 high=0 scope=backend-api,frontend,package-manager\n'
