const { minioClient } = require("./uploadToMinIO");

exports.proxyStoredMedia = async (req, res) => {
  try {
    const source = String(req.originalUrl || req.path || "").split("?")[0];
    const rawPath = source.replace(/^\/storage\//, "").replace(/^\/+/, "");
    const slash = rawPath.indexOf("/");
    if (slash <= 0) {
      return res.status(400).json({ message: "Invalid media path." });
    }

    const bucket = decodeURIComponent(rawPath.slice(0, slash));
    const objectName = decodeURIComponent(rawPath.slice(slash + 1));
    if (!bucket || !objectName) {
      return res.status(400).json({ message: "Invalid media path." });
    }

    const stat = await minioClient.statObject(bucket, objectName);
    const contentType =
      stat.metaData?.["content-type"] ||
      stat.metaData?.["Content-Type"] ||
      "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    const stream = await minioClient.getObject(bucket, objectName);
    stream.on("error", (error) => {
      console.error("Media stream error:", error);
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);
  } catch (error) {
    const notFound =
      error?.code === "NotFound" ||
      error?.code === "NoSuchKey" ||
      error?.statusCode === 404;
    if (notFound) {
      return res.status(404).json({ message: "Media not found." });
    }
    console.error("Media proxy error:", error);
    return res.status(500).json({ message: "Failed to load media." });
  }
};
