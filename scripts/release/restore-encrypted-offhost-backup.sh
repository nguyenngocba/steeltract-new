#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_ENCRYPTION_PASSPHRASE_FILE:?BACKUP_ENCRYPTION_PASSPHRASE_FILE is required}"
: "${MC_HOST_offhost:?MC_HOST_offhost is required}"

remote_file="${1:?usage: restore-encrypted-offhost-backup.sh <bucket/path/file.gpg> <output-file>}"
output_file="${2:?output file is required}"
test -f "$BACKUP_ENCRYPTION_PASSPHRASE_FILE"

mc_image="${MINIO_MC_IMAGE:-minio/mc@sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
encrypted="${work}/backup.gpg"

umask 077
docker run --rm --network host \
  -e MC_HOST_offhost \
  -v "${work}:/work" \
  "$mc_image" cp "offhost/${remote_file}" /work/backup.gpg

gpg --batch --yes --pinentry-mode loopback \
  --passphrase-file "$BACKUP_ENCRYPTION_PASSPHRASE_FILE" \
  --decrypt --output "$output_file" "$encrypted"
printf 'encrypted_backup_restored=%s\n' "$output_file"
