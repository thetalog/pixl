const express = require("express");
const app = express();
const PORT = 3001;
const authRoutes = require("./routes/authentication/root");

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Hi there!!");
});

app.use(authRoutes);

app.listen(PORT, () => {
  console.info("App listening at", PORT);
});
