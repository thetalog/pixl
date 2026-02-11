#!/usr/bin/env bash
set -e

# =========================
# CONFIG
# =========================
CONTAINER_NAME="minio"
BUCKET_NAME="pixl"

MINIO_API_HOST_PORT=9000
MINIO_CONSOLE_HOST_PORT=9001

MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD="minioadmin"

DATA_DIR="$HOME/minio-data"
MC_CONFIG_DIR="$HOME/.mc"

# =========================
# HELPERS
# =========================
log() { echo "==> $1"; }
fail() { echo "❌ $1"; exit 1; }

# Cross-platform port check (mac/linux/windows gitbash)
port_in_use() {
  local port="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  elif command -v ss >/dev/null 2>&1; then
    ss -ltn | awk '{print $4}' | grep -q ":$port$"
    return $?
  else
    log "⚠️ Cannot detect port tool (lsof/ss). Skipping port check."
    return 1
  fi
}

wait_for_minio() {
  for i in $(seq 1 30); do
    docker exec "$CONTAINER_NAME" \
      curl -sf http://127.0.0.1:9000/minio/health/ready >/dev/null && return 0
    sleep 1
  done
  return 1
}

# =========================
# START
# =========================
log "Starting MinIO (cross-platform)..."

mkdir -p "$DATA_DIR" "$MC_CONFIG_DIR"

# Remove old container
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  log "Removing old container..."
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

# Port checks
port_in_use "$MINIO_API_HOST_PORT" && fail "Port $MINIO_API_HOST_PORT already in use"
port_in_use "$MINIO_CONSOLE_HOST_PORT" && fail "Port $MINIO_CONSOLE_HOST_PORT already in use"

# Run MinIO
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${MINIO_API_HOST_PORT}:9000" \
  -p "${MINIO_CONSOLE_HOST_PORT}:9001" \
  -e MINIO_ROOT_USER="$MINIO_ROOT_USER" \
  -e MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
  -v "$DATA_DIR:/data" \
  minio/minio server /data --console-address ":9001" >/dev/null

log "Waiting for MinIO..."
wait_for_minio || fail "MinIO did not become ready"

MINIO_API_URL="http://localhost:${MINIO_API_HOST_PORT}"
MINIO_CONSOLE_URL="http://localhost:${MINIO_CONSOLE_HOST_PORT}"

log "MinIO ready ✅"
log "API:     $MINIO_API_URL"
log "Console: $MINIO_CONSOLE_URL"
log "Login:   $MINIO_ROOT_USER / $MINIO_ROOT_PASSWORD"

# =========================
# MC + BUCKET
# =========================
log "Configuring mc + bucket..."

docker run --rm \
  --network "container:${CONTAINER_NAME}" \
  -v "$MC_CONFIG_DIR:/root/.mc" \
  minio/mc alias set local \
  http://127.0.0.1:9000 \
  "$MINIO_ROOT_USER" \
  "$MINIO_ROOT_PASSWORD" >/dev/null

docker run --rm \
  --network "container:${CONTAINER_NAME}" \
  -v "$MC_CONFIG_DIR:/root/.mc" \
  minio/mc mb --ignore-existing "local/${BUCKET_NAME}" >/dev/null

docker run --rm \
  --network "container:${CONTAINER_NAME}" \
  -v "$MC_CONFIG_DIR:/root/.mc" \
  minio/mc anonymous set download "local/${BUCKET_NAME}" >/dev/null

log "Bucket '${BUCKET_NAME}' is PUBLIC ✅"
echo "Public URL:"
echo "  ${MINIO_API_URL}/${BUCKET_NAME}/<object>"

log "Done ✅"
