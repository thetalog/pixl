#!/usr/bin/env bash
set -e

# Config
RS_NAME="rs0"
DB1="/data/db1"
DB2="/data/db2"
DB3="/data/db3"

echo "==> Creating db paths..."
mkdir -p "$DB1" "$DB2" "$DB3"

echo "==> Starting mongod instances..."
mongod --port 27017 --dbpath "$DB1" --replSet "$RS_NAME" --fork --logpath "$DB1/mongod.log"
mongod --port 27018 --dbpath "$DB2" --replSet "$RS_NAME" --fork --logpath "$DB2/mongod.log"
mongod --port 27019 --dbpath "$DB3" --replSet "$RS_NAME" --fork --logpath "$DB3/mongod.log"

echo "==> Waiting 5 seconds..."
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

echo "==> Done ✅ Replica set initiated."
echo "==> Connecting to primary on 27017..."
mongosh --port 27017

