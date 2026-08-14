#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required for source parity}"
: "${STEELTRACK_BACKEND_IMAGE:?STEELTRACK_BACKEND_IMAGE is required for application smoke}"

dump="${1:?usage: verify-database-restore.sh <backup.dump>}"
checksum="${dump}.sha256"
runtime="${STEELTRACK_POSTGRES_IMAGE:-postgres:17-alpine}"
suffix="$(date +%s)-$$"
network="steeltrack-restore-${suffix}"
database="steeltrack-restore-db-${suffix}"
backend="steeltrack-restore-api-${suffix}"
password="$(openssl rand -hex 24)"
env_file="$(mktemp)"
source_counts="$(mktemp)"
restore_counts="$(mktemp)"

cleanup() {
  docker rm -f "$backend" "$database" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
  rm -f "$env_file" "$source_counts" "$restore_counts"
}
trap cleanup EXIT

test -f "$dump"
test -f "$checksum"
(cd "$(dirname "$dump")" && sha256sum -c "$(basename "$checksum")")

umask 077
cat > "$env_file" <<EOF
POSTGRES_PASSWORD=${password}
POSTGRES_DB=steeltrack_restore
POSTGRES_USER=postgres
EOF

docker network create "$network" >/dev/null
docker run -d --name "$database" --network "$network" --env-file "$env_file" "$runtime" >/dev/null

for _ in $(seq 1 60); do
  if docker exec "$database" pg_isready -U postgres -d steeltrack_restore >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$database" pg_isready -U postgres -d steeltrack_restore >/dev/null

docker exec -i "$database" pg_restore \
  --username=postgres --dbname=steeltrack_restore --no-owner --no-acl < "$dump"

catalog_sql="SELECT format('SELECT %L, count(*) FROM %I.%I;', tablename, schemaname, tablename) FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
psql "$DATABASE_URL" -Atqc "$catalog_sql" | psql "$DATABASE_URL" -Atq > "$source_counts"
docker exec "$database" psql -U postgres -d steeltrack_restore -Atqc "$catalog_sql" \
  | docker exec -i "$database" psql -U postgres -d steeltrack_restore -Atq \
  > "$restore_counts"
diff -u "$source_counts" "$restore_counts"

cat > "$env_file" <<EOF
NODE_ENV=production
DATABASE_URL=postgresql://postgres:${password}@${database}:5432/steeltrack_restore
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGINS=https://restore.invalid
STORAGE_ROOT=/data/steeltrack-storage
JOB_WORKER_ENABLED=false
EOF

docker run -d --name "$backend" --network "$network" --env-file "$env_file" \
  "$STEELTRACK_BACKEND_IMAGE" >/dev/null

for _ in $(seq 1 60); do
  if docker exec "$backend" wget -qO- http://127.0.0.1:3000/health/ready >/dev/null 2>&1; then
    break
  fi
  if [[ "$(docker inspect -f '{{.State.Running}}' "$backend")" != "true" ]]; then
    docker logs "$backend" >&2
    exit 1
  fi
  sleep 1
done
docker exec "$backend" wget -qO- http://127.0.0.1:3000/health/ready

printf 'restore_verification=PASS\n'
printf 'catalog_parity=PASS\n'
printf 'application_read_only_smoke=PASS\n'
