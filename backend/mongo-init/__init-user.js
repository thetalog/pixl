//mongo-init/init-user.js
db = db.getSiblingDB("admin");
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