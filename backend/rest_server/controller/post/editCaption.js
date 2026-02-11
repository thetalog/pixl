const { updatePostCaption } = require("../../database/post/editCaption");
const { findPostById } = require("../../database/post/getPost");

/* ================= EDIT CAPTION ================= */

exports.editPostCaptionController = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { postId, newCaption } = req.body;

    /* ---------- Validation ---------- */

    if (!postId || !newCaption) {
      return res.status(400).json({
        message: "postId and newCaption are required.",
      });
    }

    /* ---------- Check Post ---------- */

    const fetchedPost = await findPostById(postId);

    if (!fetchedPost || fetchedPost?.status === 500) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    /* ---------- Optional Ownership Check ---------- */
    // If you want strict security:
    // if (fetchedPost.data.userId !== userId) {
    //   return res.status(403).json({ message: "Unauthorized" });
    // }

    /* ---------- Update Caption ---------- */

    const response = await updatePostCaption(postId, newCaption);

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Post caption update failed.",
      });
    }

    return res.status(200).json({
      message: "Post caption updated successfully.",
    });

  } catch (error) {
    console.error("Edit caption controller error:", error);

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};
