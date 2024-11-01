const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
  res.status(200).send("Hi there!!");
});

module.exports = router;
