const express = require("express");
const router = express.Router();
const createPost = require("./createPost");
const createReel = require("./createReel");
const editCaption = require("./editCaption");

router.use("/posts", createPost, editCaption, createReel);

module.exports = router;
