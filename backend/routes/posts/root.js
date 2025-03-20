const express = require("express");
const router = express.Router();
const createPost = require("./createPost");
const editCaption = require("./editCaption");

router.use("/posts", createPost, editCaption);

module.exports = router;
