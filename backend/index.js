const express = require("express");
const app = express();
const PORT = 3001;
const authRoutes = require("./routes/authentication/root");
const { authenticationMiddleware } = require("./middlewares/authentication");
require('dotenv').config();
app.use(express.json());

app.use(authRoutes);

app.use(authenticationMiddleware);
app.get("/", (req, res) => {
  res.status(200).send("Hi there!!");
});

app.listen(PORT, () => {
  console.info("App listening at", PORT);
});
