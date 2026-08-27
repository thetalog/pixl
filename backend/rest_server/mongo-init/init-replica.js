// mongo-init/init-replica.js
const conn = new Mongo("mongodb://root:root@mongod1:27018");
const admin = conn.getDB("admin");
admin.auth("root", "root"); // optional if already authenticated

rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongod1:27018" },
    { _id: 1, host: "mongod2:27019" },
    { _id: 2, host: "mongod3:27020" },
  ],
});
db.getMongo().setReadPref("nearest");
