const { createPostRecord } = require("../../database/post/createPost");
const { uploadPostOrReel } = require("../storage/uploadToS3");
const { moderateAndLabelFiles } = require("../../lib/rekognition");
const { notifyUser } = require("../../lib/notifyUser");

/* ================= SAFE PARSE ================= */

const safeParse = (value, fallback) => {
  if (!value) return fallback;

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return fallback;
      }
    }

    if (trimmed.includes(",")) {
      return trimmed.split(",").map((x) => x.trim()).filter(Boolean);
    }

    return trimmed.length ? [trimmed] : fallback;
  }

  return value;
};

/* ================= CREATE POST ================= */

exports.createPostController = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const postsCount = req?.user?.postsCount;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let { taggedUsers, location, caption, tags } = req.body || {};

    taggedUsers = safeParse(taggedUsers, []);
    tags = safeParse(tags, []);

    location = typeof location === "string" ? location : "";
    caption = typeof caption === "string" ? caption : "";

    if (!req.files || !req.files.length) {
      return res.status(400).json({
        message: "At least one file is required.",
      });
    }

    /* ---------- Rekognition moderation + labels ---------- */

    let filesForUpload = req.files;
    try {
      const moderation = await moderateAndLabelFiles(req.files);
      if (moderation.blocked) {
        try {
          await notifyUser(userId, {
            type: "moderation",
            message:
              moderation.reason ||
              "Your photo was blocked because it may violate Pixl community guidelines.",
          });
        } catch (notifyErr) {
          console.error("Moderation notify failed:", notifyErr);
        }

        return res.status(451).json({
          error: true,
          code: "CONTENT_BLOCKED",
          message:
            moderation.reason ||
            "This photo was blocked by content moderation.",
          labels: moderation.labels || [],
        });
      }
      filesForUpload = moderation.files || req.files;
    } catch (rekErr) {
      console.error("Rekognition pipeline error (continuing upload):", rekErr);
    }

    /* ---------- Upload Media ---------- */

    const uploadResults = await uploadPostOrReel(
      userId,
      postsCount,
      filesForUpload
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

    const response = await createPostRecord(
      userId,
      taggedUsers,
      location,
      caption,
      tags,
      uploadResults
    );

    if (response?.status === 400) {
      return res.status(400).json({ message: response.message || "Invalid request." });
    }

    if (response?.status === 500) {
      return res.status(500).json({
        message: response.message || "Post failed.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Post created successfully.",
      labels: uploadResults.flatMap((f) => f.labels || []),
    });
  } catch (error) {
    console.error("Create post controller error:", error);

    return res.status(500).json({
      error: true,
      message: error?.message || "Something went wrong.",
    });
  }
};
