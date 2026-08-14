#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_ENCRYPTION_PASSPHRASE_FILE:?BACKUP_ENCRYPTION_PASSPHRASE_FILE is required}"
: "${MC_HOST_offhost:?MC_HOST_offhost is required}"
: "${OFFHOST_BACKUP_PATH:?OFFHOST_BACKUP_PATH is required}"

source_file="${1:?usage: encrypted-offhost-backup.sh <backup-file>}"
test -f "$source_file"
test -f "$BACKUP_ENCRYPTION_PASSPHRASE_FILE"

mc_image="${MINIO_MC_IMAGE:-minio/mc@sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
name="$(basename "$source_file")"
encrypted="${work}/${name}.gpg"

umask 077
gpg --batch --yes --pinentry-mode loopback \
  --passphrase-file "$BACKUP_ENCRYPTION_PASSPHRASE_FILE" \
  --cipher-algo AES256 --symmetric \
  --output "$encrypted" "$source_file"
sha256sum "$source_file" >"${work}/${name}.sha256"
sha256sum "$encrypted" >"${work}/${name}.gpg.sha256"

docker run --rm --network host \
  -e MC_HOST_offhost \
  -v "${work}:/work:ro" \
  "$mc_image" cp \
  "/work/${name}.gpg" \
  "/work/${name}.sha256" \
  "/work/${name}.gpg.sha256" \
  "offhost/${OFFHOST_BACKUP_PATH%/}/"

printf 'encrypted_backup_uploaded=%s/%s.gpg\n' \
  "$OFFHOST_BACKUP_PATH" "$name"
