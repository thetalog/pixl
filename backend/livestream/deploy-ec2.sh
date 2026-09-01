#!/usr/bin/env bash
# Deploy Pixl livestream (Java + Redis) to Ubuntu EC2.
# App + Docker live on /dev/nvme1n1 mounted at /data.
#
# Provide the Atlas URI in ONE of these ways (never printed):
#
#   ./deploy-ec2.sh -i ~/.ssh/key.pem --mongodb-uri 'mongodb+srv://USER:PASS@HOST/DB' ubuntu@EC2_IP
#   MONGODB_URI='mongodb+srv://USER:PASS@HOST/DB' ./deploy-ec2.sh -i ~/.ssh/key.pem ubuntu@EC2_IP
#   echo 'MONGODB_URI=mongodb+srv://USER:PASS@HOST/DB' > .env
#   ./deploy-ec2.sh -i ~/.ssh/key.pem ubuntu@EC2_IP
#
# Or reuse Node's Atlas URL from ../rest_server/.env (DATABASE_URL).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
REMOTE_DIR="${PIXL_EC2_DIR:-/data/pixl-livestream}"
DISK="${PIXL_EC2_DISK:-/dev/nvme1n1}"
MOUNT="${PIXL_EC2_MOUNT:-/data}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
HOST=""
CLI_URI=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -i)
      SSH_OPTS+=(-i "$2")
      shift 2
      ;;
    --mongodb-uri)
      CLI_URI="$2"
      shift 2
      ;;
    --disk)
      DISK="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *)
      HOST="$1"
      shift
      ;;
  esac
done

if [[ -z "$HOST" ]]; then
  echo "Usage: $0 [-i key.pem] [--mongodb-uri 'mongodb+srv://...'] [--disk /dev/nvme1n1] ubuntu@EC2_IP" >&2
  exit 1
fi

resolve_uri() {
  if [[ -n "$CLI_URI" ]]; then
    printf '%s' "$CLI_URI"
    return
  fi
  if [[ -n "${MONGODB_URI:-}" ]]; then
    printf '%s' "$MONGODB_URI"
    return
  fi
  if [[ -f "$ROOT/.env" ]] && grep -qE '^MONGODB_URI=' "$ROOT/.env"; then
    grep -E '^MONGODB_URI=' "$ROOT/.env" | tail -n1 | cut -d= -f2-
    return
  fi
  if [[ -f "$ROOT/../rest_server/.env" ]] && grep -qE '^DATABASE_URL=' "$ROOT/../rest_server/.env"; then
    grep -E '^DATABASE_URL=' "$ROOT/../rest_server/.env" | tail -n1 | cut -d= -f2-
    return
  fi
  echo "No MongoDB URI. Pass --mongodb-uri 'mongodb+srv://...' or set MONGODB_URI." >&2
  exit 1
}

MONGODB_URI="$(resolve_uri)"
case "$MONGODB_URI" in
  mongodb+srv://*|mongodb://*) ;;
  *)
    echo "MONGODB_URI must start with mongodb+srv:// or mongodb://" >&2
    exit 1
    ;;
esac
export MONGODB_URI
export LIVE_INTERNAL_SECRET="${LIVE_INTERNAL_SECRET:-dev-internal-secret-change-me}"
export LIVESTREAM_JWT_SECRET="${LIVESTREAM_JWT_SECRET:-dev-live-jwt-secret-change-me-32}"
export PIXL_NODE_URL="${PIXL_NODE_URL:-http://host.docker.internal:3001}"
export JANUS_ENABLED="${JANUS_ENABLED:-false}"
export LIVE_CORS_ORIGINS="${LIVE_CORS_ORIGINS:-https://pixl-personal-project.online}"

ssh_cmd() { ssh "${SSH_OPTS[@]}" "$HOST" "$@"; }

echo "==> Mounting $DISK at $MOUNT on $HOST"
ssh_cmd "DISK='$DISK' MOUNT='$MOUNT' bash -s" <<'REMOTE'
set -euo pipefail
if [[ ! -b "$DISK" ]]; then
  echo "Disk $DISK not found. Attach the EBS volume and try again. lsblk:" >&2
  lsblk >&2
  exit 1
fi
CURRENT="$(findmnt -n -o TARGET "$DISK" 2>/dev/null || true)"
if [[ -n "$CURRENT" && "$CURRENT" != "$MOUNT" ]]; then
  echo "Using existing mount $CURRENT for $DISK"
  MOUNT="$CURRENT"
fi
if [[ -z "$CURRENT" ]]; then
  if ! sudo blkid "$DISK" >/dev/null 2>&1; then
    echo "Formatting $DISK as ext4 (empty disk)"
    sudo mkfs.ext4 -L pixl-data "$DISK"
  fi
  sudo mkdir -p "$MOUNT"
  sudo mount "$DISK" "$MOUNT"
fi
UUID="$(sudo blkid -s UUID -o value "$DISK")"
if ! grep -q "$UUID" /etc/fstab; then
  echo "UUID=$UUID $MOUNT ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab >/dev/null
fi
sudo mkdir -p "$MOUNT/docker" "$MOUNT/pixl-livestream"
sudo chown "$USER:$USER" "$MOUNT/pixl-livestream"
df -h "$MOUNT"

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
DAEMON_JSON=/etc/docker/daemon.json
NEED_RESTART=0
if [[ ! -f "$DAEMON_JSON" ]] || ! grep -q "$MOUNT/docker" "$DAEMON_JSON"; then
  echo "{\"data-root\":\"$MOUNT/docker\"}" | sudo tee "$DAEMON_JSON" >/dev/null
  NEED_RESTART=1
fi
if [[ "$NEED_RESTART" -eq 1 ]]; then
  sudo systemctl stop docker docker.socket || true
  sudo mkdir -p "$MOUNT/docker"
  sudo systemctl start docker
fi
echo "DOCKER_DATA_OK $MOUNT/pixl-livestream"
REMOTE

echo "==> Copying livestream service to $REMOTE_DIR"
rsync -az --delete \
  --exclude '.gradle/' \
  --exclude 'build/' \
  --exclude '.git/' \
  --exclude '.env' \
  --exclude 'recordings/' \
  -e "ssh ${SSH_OPTS[*]}" \
  "$ROOT/" "$HOST:$REMOTE_DIR/"

echo "==> Writing remote .env (URI not logged)"
ENV_FILE="$(python3 -c '
import os, tempfile
from pathlib import Path
fd, path = tempfile.mkstemp(prefix="pixl-live-env-")
os.close(fd)
Path(path).write_text(
    "MONGODB_URI=" + os.environ["MONGODB_URI"] + "\n"
    "LIVE_INTERNAL_SECRET=" + os.environ["LIVE_INTERNAL_SECRET"] + "\n"
    "LIVESTREAM_JWT_SECRET=" + os.environ["LIVESTREAM_JWT_SECRET"] + "\n"
    "PIXL_NODE_URL=" + os.environ["PIXL_NODE_URL"] + "\n"
    "JANUS_ENABLED=" + os.environ["JANUS_ENABLED"] + "\n"
    "LIVE_CORS_ORIGINS=" + os.environ["LIVE_CORS_ORIGINS"] + "\n"
    "RECORDING_LOCAL_PATH=/var/pixl/recordings\n"
)
print(path)
')"
scp "${SSH_OPTS[@]}" "$ENV_FILE" "$HOST:$REMOTE_DIR/.env"
rm -f "$ENV_FILE"
ssh_cmd "chmod 600 '$REMOTE_DIR/.env'"

echo "==> Building and starting on $DISK"
ssh_cmd "cd '$REMOTE_DIR' && sudo docker compose -f docker-compose.ec2.yml up -d --build"

echo "==> Checking health"
ssh_cmd "bash -s" <<REMOTE
set -euo pipefail
for i in \$(seq 1 40); do
  if curl -sf http://127.0.0.1:8085/health >/dev/null; then
    echo "disk:   \$(df -h $MOUNT | tail -1)"
    echo "health: \$(curl -sf http://127.0.0.1:8085/health)"
    echo "ready:  \$(curl -sf http://127.0.0.1:8085/ready || true)"
    IP=\$(curl -sf https://checkip.amazonaws.com | tr -d '\n' || true)
    echo "open:   http://\${IP}:8085/health"
    echo
    echo "Mongo URI is in $REMOTE_DIR/.env as MONGODB_URI (file mode 600)."
    echo "On Node set LIVESTREAM_SERVICE_URL=http://127.0.0.1:8085"
    echo "If ready.database is down, allow this EC2 IP in Atlas Network Access."
    exit 0
  fi
  sleep 3
done
echo "Did not become healthy. Last logs:" >&2
cd '$REMOTE_DIR' && sudo docker compose -f docker-compose.ec2.yml logs --tail=80 pixl-livestream >&2
exit 1
REMOTE
