const express = require("express");
const router = express.Router();
const signup = require("./signup");
const login = require("./login");

router.use("/auth", signup, login);

module.exports = router;
