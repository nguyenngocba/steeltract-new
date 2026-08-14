#!/usr/bin/env bash
set -euo pipefail

test "$#" -gt 0

cosign_image="${COSIGN_IMAGE:-gcr.io/projectsigstore/cosign@sha256:f1946d0f30fc8e3777b02f2201e02efdba9fe38f4918162f937052fac98e083f}"
verify_args=()
docker_args=(--rm --user 0 --network host)

if [[ -n "${COSIGN_PUBLIC_KEY_PATH:-}" ]]; then
  test -f "$COSIGN_PUBLIC_KEY_PATH"
  key_dir="$(cd "$(dirname "$COSIGN_PUBLIC_KEY_PATH")" && pwd)"
  key_name="$(basename "$COSIGN_PUBLIC_KEY_PATH")"
  docker_args+=(-v "${key_dir}:/keys:ro")
  verify_args+=(--key "/keys/${key_name}")
elif [[ -n "${COSIGN_CERTIFICATE_IDENTITY:-}" && -n "${COSIGN_CERTIFICATE_OIDC_ISSUER:-}" ]]; then
  verify_args+=(
    --certificate-identity "$COSIGN_CERTIFICATE_IDENTITY"
    --certificate-oidc-issuer "$COSIGN_CERTIFICATE_OIDC_ISSUER"
  )
elif [[ -n "${COSIGN_CERTIFICATE_IDENTITY_REGEXP:-}" && -n "${COSIGN_CERTIFICATE_OIDC_ISSUER:-}" ]]; then
  verify_args+=(
    --certificate-identity-regexp "$COSIGN_CERTIFICATE_IDENTITY_REGEXP"
    --certificate-oidc-issuer "$COSIGN_CERTIFICATE_OIDC_ISSUER"
  )
else
  printf '%s\n' \
    'Configure COSIGN_PUBLIC_KEY_PATH or a certificate identity/identity-regexp with COSIGN_CERTIFICATE_OIDC_ISSUER.' >&2
  exit 2
fi

if [[ -f "${HOME}/.docker/config.json" ]]; then
  docker_args+=(-v "${HOME}/.docker/config.json:/root/.docker/config.json:ro")
fi

if [[ "${COSIGN_ALLOW_INSECURE_REGISTRY:-false}" == "true" ]]; then
  verify_args+=(--allow-insecure-registry)
fi
if [[ "${COSIGN_IGNORE_TLOG:-false}" == "true" ]]; then
  verify_args+=(--insecure-ignore-tlog)
fi

for image in "$@"; do
  [[ "$image" == *@sha256:* ]] || {
    printf 'Image must be an immutable digest reference: %s\n' "$image" >&2
    exit 2
  }

  docker run "${docker_args[@]}" \
    "$cosign_image" verify \
    "${verify_args[@]}" \
    "$image" >/dev/null
  printf 'signature_verified=%s\n' "$image"
done
