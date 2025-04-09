#!/bin/bash

# Delay to allow MongoDB to fully start
echo 'Waiting for MongoDB to fully start...'
sleep 10  # Add a delay to ensure MongoDB is ready

# Initialize replica set after MongoDB is ready
echo 'MongoDB started, initializing replica set...'
mongosh --host mongod1:27017 --username ${MONGO_INITDB_ROOT_USERNAME} --password ${MONGO_INITDB_ROOT_PASSWORD} --authenticationDatabase admin --eval '
  rs.initiate({
    _id: "dbrs",
    members: [
      { _id: 0, host: "mongod1:27017", state: 1 },
      { _id: 1, host: "mongod2:27017" },
      { _id: 2, host: "mongod3:27017" }
    ]
  })
'
