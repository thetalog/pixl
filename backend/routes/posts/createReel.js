const express = require("express");
const router = express.Router();
const { createReel } = require("../../controller/posts/createReel.js");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

router.post("/create-reel", upload.single("file"), async (req, res) => {
  try {
    if (!req.body.data) {
      return res.status(400).json({ message: "Missing JSON data in request." });
    }
    const { musicCredit, tags, caption, taggedUsers } = JSON.parse(
      req.body?.data
    );

    if (!musicCredit || !tags || !caption || !taggedUsers || !req.file) {
      return res.status(400).json({
        message: "musicCredit, tags, caption, taggedUsers are required.",
      });
    }
    const post = await createReel(
      req?.user?.id,
      req?.user?.postsCount,
      musicCredit,
      tags,
      caption,
      taggedUsers,
      req.file
    );
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
});

module.exports = router;
