#!/usr/bin/env bash
# Boots a single-node replica set with auth enabled.
# Runs entirely inside the mongo container so the localhost exception works
# for creating the first admin user.
set -euo pipefail

MONGO_ROOT_USERNAME="${MONGO_ROOT_USERNAME:-root}"
MONGO_ROOT_PASSWORD="${MONGO_ROOT_PASSWORD:?MONGO_ROOT_PASSWORD is required}"
MONGO_APP_USERNAME="${MONGO_APP_USERNAME:-pixl}"
MONGO_APP_PASSWORD="${MONGO_APP_PASSWORD:?MONGO_APP_PASSWORD is required}"
MONGO_APP_DB="${MONGO_APP_DB:-pixl}"
REPLICA_SET_NAME="${REPLICA_SET_NAME:-rs0}"
MONGO_HOST_FOR_RS="${MONGO_HOST_FOR_RS:-mongo:27017}"
CACHE_GB="${WIREDTIGER_CACHE_GB:-0.5}"

DATA_DIR="/data/db"
MARKER="${DATA_DIR}/.pixl_rs_initialized"

start_temp_mongod() {
  echo "Starting temporary mongod (no auth) for bootstrap..."
  mongod \
    --replSet "${REPLICA_SET_NAME}" \
    --bind_ip_all \
    --dbpath "${DATA_DIR}" \
    --wiredTigerCacheSizeGB "${CACHE_GB}" \
    --fork \
    --logpath /tmp/mongod-bootstrap.log
}

wait_for_mongo() {
  for _ in $(seq 1 60); do
    if mongosh --quiet --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "MongoDB did not become ready in time" >&2
  tail -n 50 /tmp/mongod-bootstrap.log || true
  exit 1
}

bootstrap() {
  start_temp_mongod
  wait_for_mongo

  mongosh --quiet <<EOF
const rsName = "${REPLICA_SET_NAME}";
const host = "${MONGO_HOST_FOR_RS}";
const rootUser = "${MONGO_ROOT_USERNAME}";
const rootPass = "${MONGO_ROOT_PASSWORD}";
const appUser = "${MONGO_APP_USERNAME}";
const appPass = "${MONGO_APP_PASSWORD}";
const appDb = "${MONGO_APP_DB}";

let initiated = false;
try {
  const st = rs.status();
  initiated = !!(st && st.ok);
} catch (e) {
  initiated = false;
}

if (!initiated) {
  print("Initiating replica set...");
  rs.initiate({ _id: rsName, members: [{ _id: 0, host: host }] });
}

for (let i = 0; i < 45; i++) {
  try {
    const h = db.hello();
    if (h && h.isWritablePrimary) break;
  } catch (e) {}
  sleep(1000);
}

const admin = db.getSiblingDB("admin");
const users = admin.getUsers();
const hasRoot = (users.users || []).some((u) => u.user === rootUser);
if (!hasRoot) {
  print("Creating root user...");
  admin.createUser({
    user: rootUser,
    pwd: rootPass,
    roles: [{ role: "root", db: "admin" }],
  });
}

admin.auth(rootUser, rootPass);

const app = db.getSiblingDB(appDb);
const appUsers = app.getUsers();
const hasApp = (appUsers.users || []).some((u) => u.user === appUser);
if (!hasApp) {
  print("Creating app user...");
  app.createUser({
    user: appUser,
    pwd: appPass,
    roles: [
      { role: "readWrite", db: appDb },
      { role: "dbAdmin", db: appDb },
    ],
  });
}

print("Bootstrap complete.");
EOF

  echo "Shutting down temporary mongod..."
  mongosh --quiet --eval "db.adminCommand({ shutdown: 1 })" || true
  sleep 2
  touch "${MARKER}"
}

if [[ ! -f "${MARKER}" ]]; then
  bootstrap
else
  echo "Mongo already bootstrapped; starting with auth."
fi

echo "Starting mongod with replica set + auth..."
exec mongod \
  --replSet "${REPLICA_SET_NAME}" \
  --auth \
  --bind_ip_all \
  --dbpath "${DATA_DIR}" \
  --wiredTigerCacheSizeGB "${CACHE_GB}"
