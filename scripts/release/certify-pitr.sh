#!/usr/bin/env bash
set -euo pipefail

postgres_image="${STEELTRACK_POSTGRES_IMAGE:-postgres:17-alpine}"
root="${PITR_CERT_DIR:-/tmp/steeltrack-pitr-cert}"
suffix="$(date +%s)-$$"
network="steeltrack-pitr-${suffix}"
source_container="steeltrack-pitr-source-${suffix}"
recovery_container="steeltrack-pitr-recovery-${suffix}"
source_data="${root}/source"
base_data="${root}/base"
recovery_data="${root}/recovery"
archive="${root}/archive"
password_file="${root}/password"

cleanup() {
  docker rm -f "$source_container" "$recovery_container" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
}
trap cleanup EXIT
trap 'printf "pitr_certification_failed_at_line=%s\n" "$LINENO" >&2' ERR

rm -rf "$root"
mkdir -p "$source_data" "$base_data" "$recovery_data" "$archive"
chmod 700 "$root"
chown -R 70:70 "$source_data" "$base_data" "$recovery_data" "$archive"
umask 077
openssl rand -base64 48 >"$password_file"
password="$(cat "$password_file")"

docker network create "$network" >/dev/null
docker run -d --name "$source_container" --network "$network" \
  -e POSTGRES_PASSWORD="$password" \
  -e POSTGRES_DB=steeltrack_pitr \
  -v "${source_data}:/var/lib/postgresql/data" \
  -v "${archive}:/archive" \
  "$postgres_image" postgres \
  -c wal_level=replica \
  -c archive_mode=on \
  -c archive_timeout=5s \
  -c "archive_command=test ! -f /archive/%f && cp %p /archive/%f" >/dev/null

for _ in $(seq 1 60); do
  docker exec "$source_container" pg_isready -U postgres -d steeltrack_pitr >/dev/null 2>&1 && break
  sleep 1
done
docker exec "$source_container" pg_isready -U postgres -d steeltrack_pitr >/dev/null
docker exec "$source_container" sh -c \
  'printf "host replication postgres all scram-sha-256\n" >> "$PGDATA/pg_hba.conf"'
docker exec "$source_container" psql -U postgres -d steeltrack_pitr -Atqc \
  'SELECT pg_reload_conf();' >/dev/null
docker exec "$source_container" psql -U postgres -d steeltrack_pitr -v ON_ERROR_STOP=1 \
  -c 'CREATE TABLE pitr_cert_events(id integer PRIMARY KEY, label text NOT NULL);' \
  -c "INSERT INTO pitr_cert_events VALUES (1, 'base');" >/dev/null

docker run --rm --network "$network" \
  -e PGPASSWORD="$password" \
  -v "${base_data}:/backup" \
  "$postgres_image" pg_basebackup \
  -h "$source_container" -U postgres -D /backup -Fp -X stream -c fast >/dev/null
chown -R 70:70 "$base_data"

docker exec "$source_container" psql -U postgres -d steeltrack_pitr -v ON_ERROR_STOP=1 \
  -c "INSERT INTO pitr_cert_events VALUES (2, 'recover');" >/dev/null
target_time="$(docker exec "$source_container" psql -U postgres -d steeltrack_pitr -Atqc "SELECT clock_timestamp() + interval '1 second';")"
sleep 2
docker exec "$source_container" psql -U postgres -d steeltrack_pitr -v ON_ERROR_STOP=1 \
  -c "INSERT INTO pitr_cert_events VALUES (3, 'exclude');" \
  -c 'SELECT pg_switch_wal();' >/dev/null
sleep 7
docker stop "$source_container" >/dev/null

cp -a "${base_data}/." "$recovery_data/"
rm -f "${recovery_data}/standby.signal"
cat >>"${recovery_data}/postgresql.auto.conf" <<EOF
restore_command = 'cp /archive/%f %p'
recovery_target_time = '${target_time}'
recovery_target_action = 'promote'
EOF
touch "${recovery_data}/recovery.signal"
chown -R 70:70 "$recovery_data"

docker run -d --name "$recovery_container" --network "$network" \
  -v "${recovery_data}:/var/lib/postgresql/data" \
  -v "${archive}:/archive:ro" \
  "$postgres_image" >/dev/null

for _ in $(seq 1 90); do
  docker exec "$recovery_container" pg_isready -U postgres -d steeltrack_pitr >/dev/null 2>&1 && break
  if [[ "$(docker inspect -f '{{.State.Running}}' "$recovery_container")" != "true" ]]; then
    docker logs "$recovery_container" >&2
    exit 1
  fi
  sleep 1
done

rows="$(docker exec "$recovery_container" psql -U postgres -d steeltrack_pitr -Atqc 'SELECT string_agg(id::text, '"'"','"'"' ORDER BY id) FROM pitr_cert_events;')"
test "$rows" = "1,2"
printf 'pitr=PASS recovered_rows=%s excluded_row=3 target_time=%s wal_files=%s\n' \
  "$rows" "$target_time" "$(find "$archive" -maxdepth 1 -type f | wc -l)"
