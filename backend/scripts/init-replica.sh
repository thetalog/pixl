#!/bin/bash
sleep 10
until mongosh --host mongod1 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  echo "⏳ Waiting for mongod1 to be ready..."
done
echo "✅ mongod1 is ready."

sleep 10
echo "🚀 Initiating replica set..."
mongosh --host mongod1 --port 27017 -u admin -p adminadmin1 --authenticationDatabase admin /mongo-init/init-replica.js
echo "🚀 Replica set initiated."