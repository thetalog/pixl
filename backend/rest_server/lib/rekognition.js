const AWS = require("aws-sdk");

const region = process.env.AWS_REGION || "us-east-1";

const rekognition = new AWS.Rekognition({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region,
});

/** Labels that should always block a post when confidence is high enough. */
const BLOCK_PARENT_NAMES = new Set([
  "Explicit Nudity",
  "Nudity",
  "Graphic Male Nudity",
  "Graphic Female Nudity",
  "Sexual Activity",
  "Illustrated Explicit Nudity",
  "Adult Toys",
  "Sexual Situations",
  "Graphic Violence Or Gore",
  "Violence",
  "Visually Disturbing",
  "Hate Symbols",
]);

const MIN_MODERATION_CONFIDENCE = Number(
  process.env.REKOGNITION_MODERATION_MIN_CONFIDENCE || 75
);

function isImageBuffer(file) {
  const mime = String(file?.mimetype || file?.mimeType || "").toLowerCase();
  const name = String(file?.originalname || file?.name || "").toLowerCase();
  return (
    mime.startsWith("image/") ||
    /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i.test(name)
  );
}

/**
 * DetectModerationLabels on an image buffer (max ~5MB for Bytes API).
 * Returns { blocked, labels, reason }.
 */
async function moderateImageBuffer(buffer, options = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { blocked: false, labels: [], skipped: true };
  }

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn("[Rekognition] Skipped moderation — AWS credentials missing");
    return { blocked: false, labels: [], skipped: true };
  }

  const minConfidence =
    options.minConfidence ?? MIN_MODERATION_CONFIDENCE;

  try {
    const result = await rekognition
      .detectModerationLabels({
        Image: { Bytes: buffer },
        MinConfidence: Math.min(minConfidence, 50),
      })
      .promise();

    const labels = (result.ModerationLabels || []).map((l) => ({
      name: l.Name,
      parentName: l.ParentName || "",
      confidence: l.Confidence,
    }));

    const violations = labels.filter(
      (l) =>
        l.confidence >= minConfidence &&
        (BLOCK_PARENT_NAMES.has(l.name) || BLOCK_PARENT_NAMES.has(l.parentName))
    );

    if (violations.length) {
      const top = violations.sort((a, b) => b.confidence - a.confidence)[0];
      return {
        blocked: true,
        labels: violations,
        reason: `Content blocked: ${top.name} (${Math.round(top.confidence)}% confidence)`,
      };
    }

    return { blocked: false, labels };
  } catch (error) {
    console.error("[Rekognition] moderation error:", error.message || error);
    // Fail open for infra errors so uploads aren't bricked; log for ops.
    return { blocked: false, labels: [], error: error.message, skipped: true };
  }
}

/**
 * DetectLabels for AI / similarity search indexing.
 */
async function detectImageLabels(buffer, options = {}) {
  const awsConfigured = Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
  const meta = {
    awsConfigured,
    region: process.env.AWS_REGION || "us-east-1",
    bytes: Buffer.isBuffer(buffer) ? buffer.length : 0,
  };

  if (!buffer || !Buffer.isBuffer(buffer)) {
    return {
      labels: [],
      scores: {},
      skipped: true,
      error: "Invalid image buffer",
      ...meta,
    };
  }

  // Rekognition Bytes API soft-limit ~5MB
  if (buffer.length > 5 * 1024 * 1024) {
    return {
      labels: [],
      scores: {},
      skipped: true,
      error: `Image too large for Rekognition Bytes API (${Math.round(buffer.length / 1024)}KB > 5MB)`,
      ...meta,
    };
  }

  if (!awsConfigured) {
    return {
      labels: [],
      scores: {},
      skipped: true,
      error: "AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY missing on API server",
      ...meta,
    };
  }

  const maxLabels = options.maxLabels || 25;
  const minConfidence = options.minConfidence ?? 40;

  try {
    const result = await rekognition
      .detectLabels({
        Image: { Bytes: buffer },
        MaxLabels: maxLabels,
        MinConfidence: minConfidence,
      })
      .promise();

    const scores = {};
    const labels = [];
    for (const l of result.Labels || []) {
      const name = String(l.Name || "").trim().toLowerCase();
      if (!name) continue;
      labels.push(name);
      scores[name] = Number(l.Confidence) || 0;
      for (const parent of l.Parents || []) {
        const p = String(parent.Name || "").trim().toLowerCase();
        if (p && !scores[p]) {
          labels.push(p);
          scores[p] = Math.max(scores[p] || 0, (Number(l.Confidence) || 0) * 0.85);
        }
      }
    }

    return {
      labels: [...new Set(labels)],
      scores,
      rawCount: (result.Labels || []).length,
      minConfidence,
      ...meta,
    };
  } catch (error) {
    console.error("[Rekognition] detectLabels error:", error.message || error);
    return {
      labels: [],
      scores: {},
      error: error.message || String(error),
      code: error.code || error.statusCode,
      ...meta,
    };
  }
}

/**
 * Moderate + label every image file in a multer list.
 * Returns { blocked, reason, files: enrichedFiles } where enriched files
 * have `_rekognitionLabels` / `_rekognitionScores` attached.
 */
async function moderateAndLabelFiles(files) {
  const list = Array.isArray(files) ? files : files ? [files] : [];
  const enriched = [];

  for (const file of list) {
    if (!isImageBuffer(file)) {
      enriched.push(file);
      continue;
    }

    const moderation = await moderateImageBuffer(file.buffer);
    if (moderation.blocked) {
      return {
        blocked: true,
        reason: moderation.reason,
        labels: moderation.labels,
      };
    }

    const detected = await detectImageLabels(file.buffer);
    file._rekognitionLabels = detected.labels;
    file._rekognitionScores = detected.scores;
    enriched.push(file);
  }

  return { blocked: false, files: enriched };
}

module.exports = {
  rekognition,
  isImageBuffer,
  moderateImageBuffer,
  detectImageLabels,
  moderateAndLabelFiles,
  BLOCK_PARENT_NAMES,
};
