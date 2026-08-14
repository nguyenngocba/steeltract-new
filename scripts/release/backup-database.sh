#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

backup_root="${1:-${STEELTRACK_BACKUP_DIR:-./backups/postgres}}"
retention_days="${STEELTRACK_BACKUP_RETENTION_DAYS:-35}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="steeltrack-${timestamp}"
partial="${backup_root}/${base}.dump.partial"
dump="${backup_root}/${base}.dump"

mkdir -p "$backup_root"
umask 077

pg_dump --dbname="$DATABASE_URL" --format=custom --compress=9 --no-owner --no-acl --file="$partial"
mv "$partial" "$dump"
sha256sum "$dump" > "${dump}.sha256"

cat > "${dump}.manifest" <<EOF
created_at=${timestamp}
format=postgresql-custom
checksum_file=$(basename "${dump}.sha256")
retention_days=${retention_days}
EOF

find "$backup_root" -type f \
  \( -name 'steeltrack-*.dump' -o -name 'steeltrack-*.dump.sha256' -o -name 'steeltrack-*.dump.manifest' \) \
  -mtime "+${retention_days}" -delete

printf '%s\n' "$dump"
