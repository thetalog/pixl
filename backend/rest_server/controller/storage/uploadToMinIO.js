const Minio = require("minio");
const fs = require("fs");
const ffmpeg = require('fluent-ffmpeg');
const path = require("path");
const { getVideoDurationInSeconds } = require('get-video-duration');
const os = require("os");
require("dotenv").config();

// ✅ Initialize MinIO Client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
  port: parseInt(process.env.MINIO_PORT, 10) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

// ✅ Cleanup uploaded files locally
function multerUploadsCleanup(files) {
  const filesArray = Array.isArray(files) ? files : [files];

  if (!filesArray || filesArray.length === 0) return;

  for (const file of filesArray) {
    try {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log("✅ File deleted:", file.path);
      }
    } catch (err) {
      console.error("❌ Error deleting file:", err);
    }
  }
}

async function ensurePublicRead(bucketName) {
  const policy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  });

  try {
    await minioClient.setBucketPolicy(bucketName, policy);
  } catch (error) {
    console.error(`❌ Error setting public policy on "${bucketName}":`, error);
  }
}

// ✅ Ensure bucket exists
async function ensureBucketExists(bucketName) {
  if (!bucketName) throw new Error("Bucket name is missing!");

  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      console.warn(`⚠️ Bucket "${bucketName}" does not exist. Creating...`);
      await minioClient.makeBucket(bucketName);
      console.log(`✅ Bucket "${bucketName}" created successfully.`);
    }
    await ensurePublicRead(bucketName);
  } catch (error) {
    console.error("❌ Error ensuring bucket exists:", error);
    throw error;
  }
}

// ✅ Upload posts/reels files (multiple allowed)
async function uploadPostOrReelToMinIO(userId, postCount, files) {
  const bucketName = process.env.MINIO_POSTS_BUCKET;
  if (!bucketName) throw new Error("MINIO_POSTS_BUCKET missing in .env");

  await ensureBucketExists(bucketName);
  const uploadResults = [];
  const filesArray = Array.isArray(files) ? files : [files];
  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];

    if (!file?.buffer) throw new Error("Invalid file buffer provided");
    if (!file?.originalname) throw new Error("Invalid file originalname provided");

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectName = `${userId}/${postCount + 1}/${Date.now()}_${i}_${safeName}`;
    const ffmpegThumbnailOutput = `${userId}/${postCount + 1}/_thumbnail_${Date.now()}_${i}${safeName.replace(/\.[^.]+$/, "") + ".jpg"}`;
    let duration = null;

    if (file.mimetype.startsWith("video/")) {

      // Create temp video path
      const tempVideoPath = path.join(
        os.tmpdir(),
        `${Date.now()}_${file.originalname}`
      );

      // Write buffer to temp file
      fs.writeFileSync(tempVideoPath, file.buffer);

      // Get duration from temp file
      duration = await getVideoDurationInSeconds(tempVideoPath);

      if (duration > 60) {
        fs.unlinkSync(tempVideoPath);
        return {
          error: true,
          message: "Only media under 60 seconds are allowed.",
          status: 409,
        };
      }

      // Save path for ffmpeg later
      file._tempVideoPath = tempVideoPath;
    }
    else if (file.mimetype.startsWith("image/")) {
      // Instagram-style fixed duration for images
      duration = 5;
    }


    try {
      await minioClient.putObject(bucketName, objectName, file.buffer, {
        "Content-Type": file.mimetype,
      });

      const fileUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${objectName}`;
      const thumbnailFileUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${ffmpegThumbnailOutput}`;
      if (file.mimetype.startsWith("video/")) {
        const thumbnailBase = safeName.replace(/\.[^.]+$/, "");
        const thumbnailName = `${Date.now()}_${i}_${thumbnailBase}.jpg`;

        fs.mkdirSync("thumbnail", { recursive: true });

        const thumbnailPath = path.resolve(
          "thumbnail",
          thumbnailName
        );

        await new Promise((resolve, reject) => {
          ffmpeg(file._tempVideoPath)
            .on("end", resolve)
            .on("error", reject)
            .screenshots({
              timestamps: ["1%"],
              filename: thumbnailName,
              folder: "thumbnail",
              size: "1080x1920",
            });
        });

        // ✅ NOW the file exists
        const thumbBuffer = fs.readFileSync(thumbnailPath);

        await minioClient.putObject(
          bucketName,
          ffmpegThumbnailOutput,
          thumbBuffer,
          { "Content-Type": "image/jpeg" }
        );
        if (file._tempVideoPath && fs.existsSync(file._tempVideoPath)) {
          fs.unlinkSync(file._tempVideoPath);
        }

      }
      uploadResults.push({ url: fileUrl, mimeType: file?.mimetype.split("/")[0].toUpperCase(), thumbnail: thumbnailFileUrl });
    } catch (err) {
      console.error("❌ Error uploading post file:", err);
      throw err;
    }
  }

  // multerUploadsCleanup(filesArray);

  return uploadResults;
}

// ✅ Upload Direct Message files
async function uploadDirectMediaToMinIO(userId, files) {
  const bucketName = process.env.MINIO_CONVERSATION_DIRECT_MESSAGE_BUCKET;
  if (!bucketName) throw new Error("MINIO_CONVERSATION_DIRECT_MESSAGE_BUCKET missing");

  await ensureBucketExists(bucketName);

  const uploadResults = [];
  const filesArray = Array.isArray(files) ? files : [files];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectName = `${userId}/${Date.now()}_${i}_${safeName}`;

    try {
      await minioClient.putObject(bucketName, objectName, file.buffer, {
        "Content-Type": file.mimetype,
      });

      const fileUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${objectName}`;
      console.log("✅ Direct Media uploaded:", fileUrl);
      uploadResults.push(fileUrl);
    } catch (err) {
      console.error("❌ Error uploading direct media:", err);
      throw err;
    }
  }

  multerUploadsCleanup(filesArray);

  return uploadResults;
}

// ✅ Upload Group Message files
async function uploadGroupMediaToMinIO(groupId, conversationId, files) {
  const bucketName = process.env.MINIO_CONVERSATION_GROUP_MESSAGE_BUCKET;
  if (!bucketName) throw new Error("MINIO_CONVERSATION_GROUP_MESSAGE_BUCKET missing");

  await ensureBucketExists(bucketName);

  const uploadResults = [];
  const filesArray = Array.isArray(files) ? files : [files];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectName = `${groupId}/${conversationId}/${Date.now()}_${i}_${safeName}`;

    try {
      await minioClient.putObject(bucketName, objectName, file.buffer, {
        "Content-Type": file.mimetype,
      });

      const fileUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${objectName}`;
      console.log("✅ Group Media uploaded:", fileUrl);
      uploadResults.push(fileUrl);
    } catch (err) {
      console.error("❌ Error uploading group media:", err);
      throw err;
    }
  }

  multerUploadsCleanup(filesArray);

  return uploadResults;
}

// ✅ Upload Group DP (single)
async function uploadGroupDPMediaToMinIO(groupId, file) {
  const bucketName = process.env.MINIO_CONVERSATION_GROUP_DP_BUCKET;
  if (!bucketName) throw new Error("MINIO_CONVERSATION_GROUP_DP_BUCKET missing");

  await ensureBucketExists(bucketName);

  if (!file?.buffer) throw new Error("Invalid DP file path");
  if (!file?.originalname) throw new Error("Invalid DP file originalname");

  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectName = `${groupId}/${Date.now()}_${safeName}`;

  try {
    await minioClient.putObject(bucketName, objectName, file.buffer, {
      "Content-Type": file.mimetype,
    });

    const fileUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${objectName}`;
    console.log("✅ Group DP uploaded:", fileUrl);

    multerUploadsCleanup(file);

    return [fileUrl];
  } catch (err) {
    console.error("❌ Error uploading group DP:", err);
    throw err;
  }
}

module.exports = {
  minioClient,
  uploadPostOrReelToMinIO,
  uploadDirectMediaToMinIO,
  uploadGroupDPMediaToMinIO,
  uploadGroupMediaToMinIO,
};
