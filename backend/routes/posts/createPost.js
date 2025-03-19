const express = require("express");
const router = express.Router();
const { createPost } = require("../../controller/posts/createPost.js");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.post("/create-post", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.body.data) {
      return res.status(400).json({ message: "Missing JSON data in request." });
    }
    const { tag, location, caption } = JSON.parse(req.body?.data);

    if (!tag || !location || !caption || !req.files) {
      return res.status(400).json({
        message: "tag, location, caption are required.",
      });
    }
    const post = await createPost(tag, location, caption, req.files);
    res.status(200).json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
});

module.exports = router;
