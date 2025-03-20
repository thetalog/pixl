const express = require("express");
const router = express.Router();
const { editCaption } = require("../../controller/posts/editCaption.js");

router.patch("/edit-caption", async (req, res) => {
  try {
    const { postId, newCaption } = req.body;

    if (!postId || !newCaption) {
      return res.status(400).json({
        message: "postId, newCaption are required.",
      });
    }
    const editCaptionResponse = await editCaption(
      req?.user?.id,
      postId,
      newCaption
    );
    res.status(200).json(editCaptionResponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
});

module.exports = router;
