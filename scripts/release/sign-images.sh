#!/usr/bin/env bash
set -euo pipefail

: "${COSIGN_KEY_PATH:?COSIGN_KEY_PATH is required}"

if [[ -n "${COSIGN_PASSWORD_FILE:-}" ]]; then
  test -f "$COSIGN_PASSWORD_FILE"
  COSIGN_PASSWORD="$(cat "$COSIGN_PASSWORD_FILE")"
fi
: "${COSIGN_PASSWORD:?COSIGN_PASSWORD or COSIGN_PASSWORD_FILE is required}"
export COSIGN_PASSWORD

test "$#" -gt 0
test -f "$COSIGN_KEY_PATH"

cosign_image="${COSIGN_IMAGE:-gcr.io/projectsigstore/cosign@sha256:f1946d0f30fc8e3777b02f2201e02efdba9fe38f4918162f937052fac98e083f}"
key_dir="$(cd "$(dirname "$COSIGN_KEY_PATH")" && pwd)"
key_name="$(basename "$COSIGN_KEY_PATH")"
insecure_args=()

if [[ "${COSIGN_ALLOW_INSECURE_REGISTRY:-false}" == "true" ]]; then
  insecure_args+=(--allow-insecure-registry)
fi

for image in "$@"; do
  [[ "$image" == *@sha256:* ]] || {
    printf 'Image must be an immutable digest reference: %s\n' "$image" >&2
    exit 2
  }

  docker run --rm --user 0 --network host \
    -e COSIGN_PASSWORD \
    -v "${key_dir}:/keys:ro" \
    "$cosign_image" sign --yes \
    "${insecure_args[@]}" \
    ${COSIGN_TLOG_UPLOAD:+--tlog-upload="${COSIGN_TLOG_UPLOAD}"} \
    --key "/keys/${key_name}" "$image"
done
