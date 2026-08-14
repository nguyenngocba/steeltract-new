#!/usr/bin/env bash
set -euo pipefail

backend_image="${1:?backend image is required}"
frontend_image="${2:?frontend image is required}"
output_dir="${3:-./artifacts/release-security}"

mkdir -p "$output_dir"
output_dir="$(cd "$output_dir" && pwd)"

for entry in "backend:${backend_image}" "frontend:${frontend_image}"; do
  name="${entry%%:*}"
  image="${entry#*:}"
  docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    -v "${output_dir}:/out" anchore/syft:v1.33.0 \
    "$image" -o "spdx-json=/out/${name}.spdx.json"
  docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/trivy:0.69.3 image --exit-code 1 --severity CRITICAL,HIGH \
    --scanners vuln --skip-version-check --ignore-unfixed "$image"
  sha256sum "${output_dir}/${name}.spdx.json" > "${output_dir}/${name}.spdx.json.sha256"
done
