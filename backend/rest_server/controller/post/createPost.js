const { createPostRecord } = require("../../database/post/createPost");
const { uploadPostOrReel } = require("../storage/uploadToS3");

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
      return trimmed.split(",").map(x => x.trim()).filter(Boolean);
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

    let { taggedUsers, location, caption, tags } = req.body || {};

    taggedUsers = safeParse(taggedUsers, []);
    tags = safeParse(tags, []);

    location = typeof location === "string" ? location : "";
    caption = typeof caption === "string" ? caption : "";

    /* ---------- Validation ---------- */

    if (!req.files || !req.files.length) {
      return res.status(400).json({
        message: "At least one file is required.",
      });
    }

    /* ---------- Upload Media ---------- */

    const uploadResults = await uploadPostOrReel(
      userId,
      postsCount,
      req.files
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

    const response = await createPostRecord(
      userId,
      taggedUsers,
      location,
      caption,
      tags,
      uploadResults
    );

    if (response?.status === 500) {
      return res.status(500).json({
        message: "Post failed.",
      });
    }

    /* ---------- Success ---------- */

    return res.status(200).json({
      error: false,
      message: "Post created successfully.",
    });

  } catch (error) {
    console.error("Create post controller error:", error);

    return res.status(500).json({
      error: true,
      message: "Something went wrong.",
    });
  }
};
