#!/usr/bin/env bash
set -euo pipefail

pattern='(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{30,}|AIza[0-9A-Za-z_-]{30,}|JWT_SECRET[[:space:]]*=[[:space:]]*[^$<{[:space:]][^[:space:]]{15,}|DATABASE_URL[[:space:]]*=[[:space:]]*postgres(ql)?://[^$<{[:space:]]+:[^@[:space:]]+@)'
tracked="$(git grep -IlE "$pattern" -- . ':!docs/audits/**' ':!docs/release/**' ':!**/.env.example' || true)"

if [[ -n "$tracked" ]]; then
  printf 'Potential tracked secrets detected in:\n%s\n' "$tracked" >&2
  exit 1
fi

for required in '**/.env' '**/.env.*' '**/*.key' '**/*.pem' '**/*.p12' '**/*.pfx'; do
  if ! grep -Fqx "$required" .dockerignore; then
    printf 'Docker context exclusion is missing: %s\n' "$required" >&2
    exit 1
  fi
done

printf 'tracked_secret_candidates=0 docker_context_sensitive_files=excluded\n'
