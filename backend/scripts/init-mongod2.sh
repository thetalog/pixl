#!/bin/sh

sleep 10
until mongosh --port 27018 --host mongod1 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  echo "⏳ Waiting for mongod1 to be ready..."
done


# Start mongod in background
mongod --port 27019 --replSet rs0 --keyFile /data/replica.key --bind_ip_all 
