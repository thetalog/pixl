#!/bin/bash

# Ensure log folder exists
mkdir -p /var/log

# Start MongoDB in background
exec mongod --replSet dbrs --keyFile /data/replica.key --bind_ip_all --logpath /var/log/mongodb.

# Check if mongod started
if ! pgrep -x "mongod" > /dev/null; then
  echo "❌ mongod failed to start"
  exit 1
fi

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
until mongosh --eval "db.adminCommand({ping: 1})" > /dev/null 2>&1; do
  sleep 1
done

# Use env vars for creds if available
MONGO_USER="${MONGO_INITDB_ROOT_USERNAME}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD}"

# Wait a bit for user creation to complete
sleep 3

# Initialize replica set
echo "🔄 Initializing replica set..."
mongosh "mongodb://${MONGO_USER}:${MONGO_PASS}@mongod1:27017/?authSource=admin" --eval '
  try {
    rs.status();
    print("ℹ️ Replica set already initialized");
  } catch (e) {
    if (e.codeName === "NotYetInitialized") {
      rs.initiate({
        _id: "dbrs",
        members: [
          { _id: 0, host: "mongod1:27017" },
          { _id: 1, host: "mongod2:27017" },
          { _id: 2, host: "mongod3:27017" },
          { _id: 3, host: "mongod4:27017" }
        ]
      });
      print("✅ Replica set initialized");
    } else {
      print("❌ Error checking replica set status: " + e);
      process.exit(1);
    }
  }
'

# Keep container running
echo "🚀 MongoDB replica set ready"
tail -f /var/log/mongodb.log
