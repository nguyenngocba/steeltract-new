#!/bin/sh
set -eu

prisma="./node_modules/.bin/prisma"
online_index_migration="20260717190000_enterprise_data_scalability_indexes"
online_index_sql="prisma/migrations/${online_index_migration}/migration.sql"
output="$(mktemp)"
trap 'rm -f "$output"' EXIT

set +e
"$prisma" migrate deploy >"$output" 2>&1
status=$?
set -e
cat "$output"

if [ "$status" -eq 0 ]; then
  exit 0
fi

if ! grep -Fq "Migration name: ${online_index_migration}" "$output" \
  || ! grep -Fq "CREATE INDEX CONCURRENTLY cannot run inside a transaction block" "$output"; then
  exit "$status"
fi

printf 'Applying approved online-index migration outside a transaction.\n'
psql "$DATABASE_URL" --set ON_ERROR_STOP=1 --file "$online_index_sql"
"$prisma" migrate resolve --applied "$online_index_migration"
"$prisma" migrate deploy
