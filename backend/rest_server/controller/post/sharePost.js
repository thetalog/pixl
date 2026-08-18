const { generateShareLink } = require("../../database/post/sharePost");

/* ================= GENERATE POST SHARE LINK ================= */

exports.generatePostShareLinkController = async (req, res) => {
  try {
    const { postId } = req.query;

    /* ---------- Validation ---------- */

    if (!postId) {
      return res.status(400).json({
        message: "postId is required",
      });
    }

    /* ---------- Database ---------- */

    const response = await generateShareLink(postId);

    if (!response?.data) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }

    /* ---------- Generate Link ---------- */

    const origin = String(req.headers.origin || process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const link = `${origin}/posts/${response.data.id}`;

    /* ---------- Success ---------- */

    return res.status(200).json({
      message: "Link generated successfully",
      data: link,
    });

  } catch (error) {
    console.error("Generate share link controller error:", error);

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};
