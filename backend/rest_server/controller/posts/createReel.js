import { dbCreateReel } from "../../database/query/posts/createReel.js";
import { uploadPostOrReelToMinIO } from "../object_storage/uploadFilesToMinIO.js";

/* ================= CREATE REEL ================= */

export const createReelController = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const reelCount = req?.user?.postsCount;

    if (!req.body?.data) {
      return res.status(400).json({
        message: "Missing JSON data in request.",
      });
    }

    const {
      musicCredit,
      tags,
      caption,
      taggedUsers,
    } = JSON.parse(req.body.data || "{}");

    /* ---------- Validation ---------- */

    if (!musicCredit || !tags || !caption || !taggedUsers) {
      return res.status(400).json({
        message: "musicCredit, tags, caption, taggedUsers are required.",
      });
    }

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
      return res.status(500).json(uploadResults);
    }

    if (!uploadResults || uploadResults.length === 0) {
      return res.status(500).json({
        message: "No files uploaded.",
      });
    }

    /* ---------- Database ---------- */

    const response = await dbCreateReel(
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
