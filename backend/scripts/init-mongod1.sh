#!/bin/sh

# Start mongod in background
mongod --port 27018 --bind_ip_all &

# Run your user init script
# Connect to MongoDB and create the admin user
mongosh "mongodb://mongod1:27018/?directConnection=true" <<EOF
  use admin;
  db.createUser({
    user: "admin",
    pwd: "adminadmin1",
    roles: [
      { role: "root", db: "admin" },
      { role: "clusterAdmin", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" },
      { role: "dbAdminAnyDatabase", db: "admin" },
      { role: "userAdminAnyDatabase", db: "admin" }
    ]
  });
EOF

# Wait for the first mongod instance to be ready
sleep 10
until mongosh --port 27018 --eval "db.adminCommand('ping')" >/dev/null 2>&1; do
  echo "⏳ Waiting for mongod1 to be ready..."
done
echo "✅ mongod1 is ready."

mongod --port 27018 --replSet rs0 --keyFile /data/replica.key --bind_ip_all --auth &


# Keep the container running
wait