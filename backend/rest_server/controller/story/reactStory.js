const { toggleStoryLike } = require("../../database/story/react.js");

exports.reactStoryController = async (req, res) => {
  try {
    const user = req.user;
    const { storyId } = req.params;

    if (!storyId) {
      return res.status(400).json({ message: "storyId is required." });
    }
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const response = await toggleStoryLike(user, storyId);

    if (response?.status === 404) {
      return res.status(404).json({ message: response.message || "Story not found." });
    }
    if (response?.status === 500) {
      return res.status(500).json({ message: "Failed to like/unlike story." });
    }

    return res.status(200).json({
      message: response?.message || "Story updated successfully.",
    });
  } catch (error) {
    console.error("React story controller error:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
};
