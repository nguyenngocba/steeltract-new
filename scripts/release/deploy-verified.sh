#!/usr/bin/env bash
set -euo pipefail

: "${STEELTRACK_MIGRATION_IMAGE:?STEELTRACK_MIGRATION_IMAGE is required}"
: "${STEELTRACK_BACKEND_IMAGE:?STEELTRACK_BACKEND_IMAGE is required}"
: "${STEELTRACK_FRONTEND_IMAGE:?STEELTRACK_FRONTEND_IMAGE is required}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
compose_file="${STEELTRACK_COMPOSE_FILE:-deployment/docker-compose.production.yml}"

for image in \
  "$STEELTRACK_MIGRATION_IMAGE" \
  "$STEELTRACK_BACKEND_IMAGE" \
  "$STEELTRACK_FRONTEND_IMAGE"; do
  [[ "$image" == *@sha256:* ]] || {
    printf 'Deployment image must use an immutable digest: %s\n' "$image" >&2
    exit 2
  }
done

"${script_dir}/verify-images.sh" \
  "$STEELTRACK_MIGRATION_IMAGE" \
  "$STEELTRACK_BACKEND_IMAGE" \
  "$STEELTRACK_FRONTEND_IMAGE"

docker compose -f "$compose_file" "$@"
