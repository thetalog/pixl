#!/usr/bin/env bash
set -e

# =========================
# CONFIG
# =========================
RS_NAME="rs0"

BASE_DIR="$HOME/mongo-replica"
DB1="$BASE_DIR/db1"
DB2="$BASE_DIR/db2"
DB3="$BASE_DIR/db3"

LOG1="$DB1/mongod.log"
LOG2="$DB2/mongod.log"
LOG3="$DB3/mongod.log"

# =========================
# START
# =========================
echo "==> Creating db paths..."
mkdir -p "$DB1" "$DB2" "$DB3"

echo "==> Stopping any running mongod on ports 27017-27019 (if any)..."
pkill -f "mongod --port 27017" || true
pkill -f "mongod --port 27018" || true
pkill -f "mongod --port 27019" || true

sleep 2

echo "==> Starting mongod instances..."

mongod --replSet "$RS_NAME" \
  --port 27017 \
  --dbpath "$DB1" \
  --bind_ip localhost \
  --fork --logpath "$LOG1"

mongod --replSet "$RS_NAME" \
  --port 27018 \
  --dbpath "$DB2" \
  --bind_ip localhost \
  --fork --logpath "$LOG2"

mongod --replSet "$RS_NAME" \
  --port 27019 \
  --dbpath "$DB3" \
  --bind_ip localhost \
  --fork --logpath "$LOG3"

echo "==> Waiting for mongod to start..."
sleep 5

echo "==> Initiating replica set..."

mongosh --port 27017 --quiet <<EOF
rs.initiate({
  _id: "$RS_NAME",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})
EOF

echo "==> Replica set initiated ✅"

echo "==> Replica set status:"
mongosh --port 27017 --quiet --eval "rs.status().members.map(m => ({name: m.name, state: m.stateStr}))"

echo "==> Connecting to PRIMARY..."
mongosh --port 27017
