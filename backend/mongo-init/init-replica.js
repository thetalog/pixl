// mongo-init/init-replica.js
const conn = new Mongo();
const admin = conn.getDB("admin");

admin.auth("admin", "adminadmin1");

rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongod1:27017" },
    { _id: 1, host: "mongod2:27017" },
    { _id: 2, host: "mongod3:27017" },
    { _id: 3, host: "mongod4:27017" }
  ]
});
