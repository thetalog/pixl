const { dbGetAllFollowedStories } = require("../../database/post/getFollowedStories");

/* ================= GET FOLLOWED STORIES ================= */

exports.getFollowedStoriesController = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const response = await dbGetAllFollowedStories(user);

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Failed to fetch stories.",
      });
    }

    return res.status(200).json({
      data: response?.data || response,
    });

  } catch (error) {
    console.error("Get followed stories controller error:", error);

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};
