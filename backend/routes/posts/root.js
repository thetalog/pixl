const express = require("express");
const router = express.Router();
const createPost = require("./createPost");

router.use("/posts", createPost);

module.exports = router;
