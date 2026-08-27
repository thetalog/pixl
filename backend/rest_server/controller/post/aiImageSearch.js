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
  const pipeline = {
    stage: "parse_query",
    steps: [],
  };

  try {
    const raw = req.query.q ?? req.query.query ?? req.query.search ?? "";
    const q = Array.isArray(raw) ? String(raw[0] || "") : String(raw || "");
    const trimmed = q.trim();

    pipeline.steps.push({
      id: "parse_query",
      ok: Boolean(trimmed),
      detail: trimmed ? `q="${trimmed}"` : "missing q",
    });

    if (!trimmed) {
      return res.status(400).json({
        message: "Query q is required.",
        query: "",
        tokens: [],
        data: [],
        pipeline: { ...pipeline, stage: "parse_query", ok: false },
      });
    }

    pipeline.stage = "database_search";
    const take = Math.min(Number(req.query.take) || 24, 48);
    const result = await findPostsByNaturalLanguage(trimmed, {
      take,
      viewerUserId: req?.user?.id,
    });

    pipeline.steps.push({
      id: "database_search",
      ok: true,
      detail: `tokens=[${(result.tokens || []).join(", ")}] candidates=${(result.data || []).length}`,
    });
    pipeline.stage = "done";
    pipeline.ok = true;

    return res.status(result.status).json({ ...result, pipeline });
  } catch (error) {
    console.error("AI image search error:", error);
    pipeline.ok = false;
    pipeline.error = error.message;
    return res.status(500).json({
      message: "Search failed.",
      error: error.message,
      data: [],
      pipeline,
    });
  }
};

/**
 * GET /posts/similar?postId=...
 * POST /posts/similar  (multipart file)
 */
exports.similarImagesController = async (req, res) => {
  const pipeline = {
    stage: "start",
    steps: [],
    ok: false,
  };

  try {
    const take = Math.min(Number(req.query.take || req.body?.take) || 24, 48);
    const postId = String(req.query.postId || req.body?.postId || "").trim();
    const viewerUserId = req?.user?.id;

    if (postId) {
      pipeline.stage = "load_source_post";
      const source = await getPostLabels(postId);
      pipeline.steps.push({
        id: "load_source_post",
        ok: Boolean(source),
        detail: source
          ? `postId=${postId} labels=${(source.labels || []).length}`
          : `post not found: ${postId}`,
      });

      if (!source) {
        return res.status(404).json({
          message: "Post not found.",
          pipeline,
        });
      }

      if (!(source.labels || []).length) {
        pipeline.stage = "source_labels";
        pipeline.steps.push({
          id: "source_labels",
          ok: false,
          detail:
            "Source post has no Rekognition/user tags yet. Re-upload or use image upload similarity.",
        });
        return res.status(200).json({
          message: "Source post has no visual labels to compare.",
          data: [],
          labels: [],
          pipeline,
        });
      }

      pipeline.stage = "match_similar";
      const result = await findSimilarPostsByLabels(source.labels, {
        excludePostId: postId,
        take,
        viewerUserId,
      });
      pipeline.steps.push({
        id: "match_similar",
        ok: true,
        detail: `matches=${(result.data || []).length}`,
      });
      pipeline.stage = "done";
      pipeline.ok = true;

      return res.status(result.status).json({
        ...result,
        sourcePostId: postId,
        pipeline,
      });
    }

    const file = req.file;
    pipeline.stage = "receive_upload";
    pipeline.steps.push({
      id: "receive_upload",
      ok: Boolean(file),
      detail: file
        ? `name=${file.originalname} mime=${file.mimetype} bytes=${file.buffer?.length || 0}`
        : "no file in multipart field 'file'",
    });

    if (!file) {
      return res.status(400).json({
        message: "Provide postId or upload an image file.",
        pipeline,
      });
    }

    pipeline.stage = "validate_image";
    const valid = isImageBuffer(file);
    pipeline.steps.push({
      id: "validate_image",
      ok: valid,
      detail: valid ? "image accepted" : "not an image file",
    });

    if (!valid) {
      return res.status(400).json({
        message: "Only image files are supported for similarity search.",
        pipeline,
      });
    }

    pipeline.stage = "rekognition_detect_labels";
    const detected = await detectImageLabels(file.buffer);
    pipeline.steps.push({
      id: "rekognition_detect_labels",
      ok: Boolean(detected.labels?.length),
      detail: detected.labels?.length
        ? `labels=${detected.labels.slice(0, 12).join(", ")}`
        : detected.error ||
          (detected.skipped ? "Rekognition skipped" : "no labels returned"),
      awsConfigured: detected.awsConfigured,
      region: detected.region,
      bytes: detected.bytes,
      skipped: detected.skipped,
      error: detected.error,
      code: detected.code,
    });

    if (!detected.labels?.length) {
      return res.status(200).json({
        message: detected.error
          ? `Label detection failed: ${detected.error}`
          : "No visual labels detected for this image.",
        data: [],
        labels: [],
        pipeline: { ...pipeline, ok: false },
        diagnostics: {
          awsConfigured: detected.awsConfigured,
          region: detected.region,
          skipped: detected.skipped,
          error: detected.error,
          code: detected.code,
          bytes: detected.bytes,
        },
      });
    }

    pipeline.stage = "match_similar";
    const result = await findSimilarPostsByLabels(detected.labels, {
      take,
      viewerUserId,
    });
    pipeline.steps.push({
      id: "match_similar",
      ok: true,
      detail: `matches=${(result.data || []).length}`,
    });
    pipeline.stage = "done";
    pipeline.ok = true;

    return res.status(result.status).json({ ...result, pipeline });
  } catch (error) {
    console.error("Similar images error:", error);
    pipeline.ok = false;
    pipeline.error = error.message;
    return res.status(500).json({
      message: "Similarity search failed.",
      error: error.message,
      pipeline,
    });
  }
};
