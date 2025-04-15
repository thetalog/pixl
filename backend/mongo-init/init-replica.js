// mongo-init/init-replica.js
const conn = new Mongo("mongodb://admin:adminadmin1@mongod1:27018,mongod2:27019,mongod3:27020,mongod4:27021/?replicaSet=rs0&authSource=admin");
const admin = conn.getDB("admin");
admin.auth("admin", "adminadmin1"); // optional if already authenticated

rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongod1:27018" },
    { _id: 1, host: "mongod2:27019" },
    { _id: 2, host: "mongod3:27020" },
    { _id: 3, host: "mongod4:27021", arbiterOnly: true },
  ],
});
db.getMongo().setReadPref("nearest");
