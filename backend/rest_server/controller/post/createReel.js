const { createReelRecord } = require("../../database/post/createReel");
const { uploadPostOrReelToMinIO } = require("../storage/uploadToMinIO");

/* ================= CREATE REEL ================= */

exports.createReelController = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const reelCount = req?.user?.postsCount;

    if (!req.body?.data) {
      return res.status(400).json({
        message: "Missing JSON data in request.",
      });
    }

    let parsed = {};
    try {
      parsed = JSON.parse(req.body.data || "{}");
    } catch {
      return res.status(400).json({
        message: "Invalid reel data.",
      });
    }

    const {
      musicCredit = "Original audio",
      tags = [],
      caption = " ",
      taggedUsers = [],
    } = parsed;

    /* ---------- Validation ---------- */

    if (!req.file) {
      return res.status(400).json({
        message: "Reel file is required.",
      });
    }

    /* ---------- Upload Media ---------- */

    const uploadResults = await uploadPostOrReelToMinIO(
      userId,
      reelCount,
      req.file
    );

    if (uploadResults?.error) {
      return res.status(uploadResults.status || 500).json({
        message: uploadResults.message || "Upload failed.",
      });
    }

    if (!uploadResults || uploadResults.length === 0) {
      return res.status(500).json({
        message: "No files uploaded.",
      });
    }

    /* ---------- Database ---------- */

    const response = await createReelRecord(
      userId,
      musicCredit,
      tags,
      caption,
      taggedUsers,
      uploadResults
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Reel creation failed.",
      });
    }

    /* ---------- Success ---------- */

    return res.status(200).json({
      error: false,
      message: "Reel created successfully.",
    });

  } catch (error) {
    console.error("Create reel controller error:", error);

    return res.status(500).json({
      error: true,
      message: "Something went wrong.",
    });
  }
};
