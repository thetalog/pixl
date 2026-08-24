const { createStory } = require("../../database/post/createStory");
const { uploadPostOrReel } = require("../storage/uploadToS3");

/* ================= CREATE STORY ================= */

const createStoryController = async (req, res) => {
  try {
    const user = req.user;
    const file = req.file;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!file) {
      return res.status(400).json({
        message: "Story media file is required",
      });
    }

    let taggedUsers = [];
    let location = null;
    let caption = "";
    let tags = [];

    if (req.body?.data) {
      try {
        const parsed = JSON.parse(req.body.data);
        taggedUsers = parsed.taggedUsers ?? [];
        location = parsed.location ?? null;
        caption = parsed.caption ?? "";
        tags = parsed.tags ?? [];
      } catch {
        return res.status(400).json({
          message: "Invalid JSON in data field",
        });
      }
    }

    /* ---------- Upload ---------- */

    const uploadResults = await uploadPostOrReel(
      user.id,
      0, // Stories don't need post count
      file
    );

    if (uploadResults?.error) {
      return res.status(uploadResults.status ?? 500).json({
        message: uploadResults.message ?? "Failed to upload story media.",
      });
    }

    if (!uploadResults?.length) {
      return res.status(500).json({
        message: "Failed to upload story media.",
      });
    }

    /* ---------- Database ---------- */

    const response = await createStory(
      user.id,
      taggedUsers,
      uploadResults
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Story creation failed.",
      });
    }

    /* ---------- Success ---------- */

    return res.status(201).json({
      message: "Story created successfully.",
      data: response?.data || response,
    });

  } catch (error) {
    console.error("Create story controller error:", error);

    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

module.exports = {
  createStoryController,
};
