const {
  findPostsByNaturalLanguage,
  findSimilarPostsByLabels,
  getPostLabels,
} = require("../../database/post/aiSearch");
const { detectImageLabels, isImageBuffer } = require("../../lib/rekognition");

/**
 * GET /posts/ai-search?q=sunset+beach
 */
exports.aiImageSearchController = async (req, res) => {
  try {
    const q = String(req.query.q || req.query.query || "").trim();
    if (!q) {
      return res.status(400).json({ message: "Query q is required." });
    }
    const take = Math.min(Number(req.query.take) || 24, 48);
    const result = await findPostsByNaturalLanguage(q, { take });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("AI image search error:", error);
    return res.status(500).json({ message: "Search failed." });
  }
};

/**
 * GET /posts/similar?postId=...
 * POST /posts/similar  (multipart file) — visual similarity from an uploaded image
 */
exports.similarImagesController = async (req, res) => {
  try {
    const take = Math.min(Number(req.query.take || req.body?.take) || 24, 48);
    const postId = String(req.query.postId || req.body?.postId || "").trim();

    if (postId) {
      const source = await getPostLabels(postId);
      if (!source) {
        return res.status(404).json({ message: "Post not found." });
      }
      const result = await findSimilarPostsByLabels(source.labels, {
        excludePostId: postId,
        take,
      });
      return res.status(result.status).json({
        ...result,
        sourcePostId: postId,
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: "Provide postId or upload an image file.",
      });
    }

    if (!isImageBuffer(file)) {
      return res.status(400).json({ message: "Only image files are supported for similarity search." });
    }

    const detected = await detectImageLabels(file.buffer);
    if (!detected.labels?.length) {
      return res.status(200).json({
        message: "No visual labels detected for this image.",
        data: [],
        labels: [],
      });
    }

    const result = await findSimilarPostsByLabels(detected.labels, { take });
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Similar images error:", error);
    return res.status(500).json({ message: "Similarity search failed." });
  }
};
