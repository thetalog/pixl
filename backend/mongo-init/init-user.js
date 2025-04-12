db.createUser({
    user: "admin",
    pwd: "adminadmin1",
    roles: [ { role: "root", db: "admin" } ]
  });
  