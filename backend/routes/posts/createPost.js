const express = require("express");
const router = express.Router();
const { createPost } = require("../../controller/posts/createPost.js");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.post("/create-post", upload.single("file", 10), async (req, res) => {
  try {
    if (!req.body.data) {
      return res.status(400).json({ message: "Missing JSON data in request." });
    }
    const { taggedUsers, location, caption, tags } = JSON.parse(req.body?.data);

    if (!taggedUsers || !location || !caption || !tags || !req.files) {
      return res.status(400).json({
        message: "taggedUsers, location, caption, tags are required.",
      });
    }
    const post = await createPost(
      req?.user?.id,
      req?.user?.postsCount,
      taggedUsers,
      location,
      caption,
      tags,
      req.files
    );
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
});

module.exports = router;
