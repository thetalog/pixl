#!/bin/bash
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10  # Wait for primary to be fully up

echo "🚀 Initiating replica set..."
mongosh --host mongod1 -u admin -p adminadmin1 --authenticationDatabase admin /mongo-init/init-replica.js
