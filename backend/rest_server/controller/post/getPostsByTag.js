const { findPostsByTag } = require("../../database/post/getPostsByTag");

exports.getPostsByTagController = async (req, res) => {
  try {
    const tag = req.query.tag;
    if (!tag) {
      return res.status(400).json({ message: "tag is required." });
    }

    const response = await findPostsByTag(tag);
    if (response?.status === 500) {
      return res.status(500).json({ message: "Failed to fetch tagged posts." });
    }

    return res.status(200).json({
      message: response.message,
      data: response.data || [],
    });
  } catch (error) {
    console.error("Get posts by tag controller error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};
