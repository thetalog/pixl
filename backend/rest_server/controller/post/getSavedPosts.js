const { getSavedPosts } = require("../../database/post/getSavedPosts");

exports.getSavedPostsController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const response = await getSavedPosts(req.user);
    if (response?.status === 500) {
      return res.status(500).json({ message: "Failed to fetch saved posts." });
    }

    return res.status(200).json({
      message: response.message,
      data: response.data || [],
    });
  } catch (error) {
    console.error("Get saved posts controller error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};
