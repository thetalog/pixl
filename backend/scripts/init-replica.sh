#!/bin/bash
until mongosh --host mongod1 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  echo "⏳ Waiting for mongod1 to be ready..."
  sleep 5
done

echo "🚀 Initiating replica set..."
mongosh --host mongod1 -u admin -p adminadmin1 --authenticationDatabase admin /mongo-init/init-replica.js