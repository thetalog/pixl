#!/bin/sh

# Start mongod in background
mongod --replSet rs0 --keyFile /data/replica.key --bind_ip_all &

# Wait for mongod to be ready (simple wait, replace with a proper check in production)
sleep 5

# Initialize replica set (optional if not done yet)
mongosh --eval 'rs.initiate()'

# Run your user init script
mongosh < /docker-entrypoint-initdb.d/init-user.js

# Keep the container running
wait