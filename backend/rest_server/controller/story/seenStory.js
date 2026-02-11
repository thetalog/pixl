const { markStoryAsViewed } = require("../../database/story/seen.js");

exports.seenStoryController = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { storyID } = req.body;

    /* ================= VALIDATION ================= */

    if (!userId || !storyID) {
      return res.status(400).json({
        message: "userId and storyID are required",
      });
    }

    /* ================= DATABASE ================= */

    const response = await markStoryAsViewed(userId, storyID);

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Story seen failed.",
      });
    }

    /* ================= RESPONSE ================= */

    return res.status(200).json({
      message: "Story seen.",
    });

  } catch (error) {
    console.error("Seen story controller error:", error);

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};
