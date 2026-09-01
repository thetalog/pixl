const app = require("./app");
const { seedAdminSystem } = require("./lib/admin/seed");

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  seedAdminSystem();
});
