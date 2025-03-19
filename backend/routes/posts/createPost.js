const express = require("express");
const router = express.Router();
const {    createPost } = require("../../controller/posts/createPost.js");

router.put("/create-post", async (req, res, next) => {
  try {
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
});

module.exports = router;
