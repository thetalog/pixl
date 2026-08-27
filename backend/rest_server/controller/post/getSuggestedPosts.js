const { findSuggestedPosts } = require("../../database/post/getSuggestedPosts");

exports.getSuggestedPostsController = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized", data: [] });
    }

    const response = await findSuggestedPosts(user, {
      take: req.query.take,
      skip: req.query.skip,
    });

    if (response.status === 500) {
      return res.status(500).json({
        message: response.message || "Failed to fetch suggested posts.",
        data: [],
      });
    }

    return res.status(200).json({
      message: response.message,
      data: response.data || [],
    });
  } catch (error) {
    console.error("getSuggestedPostsController error:", error);
    return res.status(500).json({ message: "Something went wrong.", data: [] });
  }
};
