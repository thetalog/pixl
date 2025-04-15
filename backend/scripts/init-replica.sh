#!/bin/bash
sleep 10
until mongosh --host mongod1 --port 27018 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  echo "⏳ Waiting for mongod1 to be ready..."
done
echo "✅ mongod1 is ready."
until mongosh --host mongod2 --port 27019 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  echo "⏳ Waiting for mongod2 to be ready..."
done
echo "✅ mongod2 is ready."

until mongosh --host mongod3 --port 27020 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  echo "⏳ Waiting for mongod3 to be ready..."
done
echo "✅ mongod3 is ready."

until mongosh --host mongod4 --port 27021 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  echo "⏳ Waiting for mongod4 to be ready..."
done
echo "✅ mongod4 is ready."

sleep 10
echo "🚀 Initiating replica set..."
mongosh --host mongod1 --port 27018 -u admin -p adminadmin1 --authenticationDatabase admin /mongo-init/init-replica.js
echo "🚀 Replica set initiated."