#!/bin/bash

echo "🔍 Checking Replica Set Status..."

primary=""
primary_id=""

while [ -z "$primary" ]; do
    echo "🔄 Waiting for PRIMARY election..."
    sleep 2
    readarray -t result < <(mongosh --host mongod1:27017 --username admin --password adminadmin1 --authenticationDatabase admin --quiet --eval '
        var status = rs.status();
        var primaryMember = status.members.find(m => m.stateStr === "PRIMARY");
        if (primaryMember) {
            print(primaryMember.name);
            print(primaryMember._id);
        } else {
            print("");
            print("");
        }
    ')
    primary="${result[0]}"
    primary_id="${result[1]}"
done

echo "✅ PRIMARY elected: $primary"
echo "🔢 PRIMARY member ID: $primary_id"
