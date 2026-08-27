const AWS = require("aws-sdk");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const { getVideoDurationInSeconds } = require("get-video-duration");
const os = require("os");
require("dotenv").config();

const region = process.env.AWS_REGION || "us-east-1";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region,
  signatureVersion: "v4",
});

function publicObjectUrl(bucketName, objectName) {
  const base = String(process.env.S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (base) {
    return `${base}/${bucketName}/${objectName}`;
  }
  // Virtual-hosted–style URL
  if (region === "us-east-1") {
    return `https://${bucketName}.s3.amazonaws.com/${objectName}`;
  }
  return `https://${bucketName}.s3.${region}.amazonaws.com/${objectName}`;
}

function multerUploadsCleanup(files) {
  const filesArray = Array.isArray(files) ? files : [files];
  if (!filesArray || filesArray.length === 0) return;

  for (const file of filesArray) {
    try {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.error("Error deleting temp file:", err);
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
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  });

  try {
    await s3
      .putBucketPolicy({ Bucket: bucketName, Policy: policy })
      .promise();
  } catch (error) {
    // Buckets may already be public via console, or account blocks public ACLs.
    console.warn(`Could not set public policy on "${bucketName}":`, error.message);
  }
}

async function ensureBucketExists(bucketName) {
  if (!bucketName) throw new Error("Bucket name is missing!");

  try {
    await s3.headBucket({ Bucket: bucketName }).promise();
  } catch (error) {
    if (error.statusCode === 404 || error.code === "NotFound" || error.code === "NoSuchBucket") {
      console.warn(`Bucket "${bucketName}" does not exist. Creating...`);
      const params = { Bucket: bucketName };
      if (region !== "us-east-1") {
        params.CreateBucketConfiguration = { LocationConstraint: region };
      }
      await s3.createBucket(params).promise();
      console.log(`Bucket "${bucketName}" created.`);
    } else {
      console.error("Error checking bucket:", error);
      throw error;
    }
  }

  await ensurePublicRead(bucketName);
}

async function putObject(bucketName, objectName, body, contentType) {
  await s3
    .putObject({
      Bucket: bucketName,
      Key: objectName,
      Body: body,
      ContentType: contentType || "application/octet-stream",
    })
    .promise();
}

async function uploadPostOrReel(userId, postCount, files) {
  const bucketName = process.env.S3_BUCKET_POSTS;
  if (!bucketName) throw new Error("S3_BUCKET_POSTS missing in .env");

  await ensureBucketExists(bucketName);
  const uploadResults = [];
  const filesArray = Array.isArray(files) ? files : [files];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];

    if (!file?.buffer) throw new Error("Invalid file buffer provided");
    if (!file?.originalname) throw new Error("Invalid file originalname provided");

    const mime = String(file.mimetype || file.mimeType || "").toLowerCase();
    const originalName = String(file.originalname || "file");
    const isVideo =
      mime.startsWith("video/") ||
      /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(originalName);
    const isImage =
      mime.startsWith("image/") ||
      /\.(jpe?g|png|gif|webp|heic|heif|avif)$/i.test(originalName);

    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const count = Number(postCount) || 0;
    const objectName = `${userId}/${count + 1}/${Date.now()}_${i}_${safeName}`;
    const thumbnailKey = `${userId}/${count + 1}/_thumbnail_${Date.now()}_${i}${safeName.replace(/\.[^.]+$/, "") + ".jpg"}`;
    let duration = null;

    if (isVideo) {
      const tempVideoPath = path.join(os.tmpdir(), `${Date.now()}_${safeName}`);
      fs.writeFileSync(tempVideoPath, file.buffer);

      try {
        duration = await getVideoDurationInSeconds(tempVideoPath);
      } catch (durationErr) {
        console.error("Could not read video duration:", durationErr);
        duration = null;
      }

      if (duration > 60) {
        fs.unlinkSync(tempVideoPath);
        return {
          error: true,
          message: "Only media under 60 seconds are allowed.",
          status: 409,
        };
      }

      file._tempVideoPath = tempVideoPath;
    } else if (isImage) {
      duration = 5;
    }

    try {
      await putObject(
        bucketName,
        objectName,
        file.buffer,
        file.mimetype || (isVideo ? "video/mp4" : "application/octet-stream")
      );

      const fileUrl = publicObjectUrl(bucketName, objectName);
      let thumbnailUrl = "";

      if (isVideo && file._tempVideoPath) {
        try {
          const thumbnailBase = safeName.replace(/\.[^.]+$/, "");
          const thumbnailName = `${Date.now()}_${i}_${thumbnailBase}.jpg`;
          const thumbnailDir = path.join(os.tmpdir(), "pixl-thumbnails");
          fs.mkdirSync(thumbnailDir, { recursive: true });
          const thumbnailPath = path.join(thumbnailDir, thumbnailName);

          await new Promise((resolve, reject) => {
            ffmpeg(file._tempVideoPath)
              .on("end", resolve)
              .on("error", reject)
              .screenshots({
                timestamps: ["1%"],
                filename: thumbnailName,
                folder: thumbnailDir,
                size: "1080x1920",
              });
          });

          const thumbBuffer = fs.readFileSync(thumbnailPath);
          await putObject(bucketName, thumbnailKey, thumbBuffer, "image/jpeg");
          thumbnailUrl = publicObjectUrl(bucketName, thumbnailKey);
          if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
        } catch (thumbErr) {
          console.error("Reel thumbnail failed, continuing without it:", thumbErr);
        } finally {
          if (file._tempVideoPath && fs.existsSync(file._tempVideoPath)) {
            fs.unlinkSync(file._tempVideoPath);
          }
        }
      }

      uploadResults.push({
        url: fileUrl,
        mimeType: isVideo ? "VIDEO" : isImage ? "IMAGE" : "IMAGE",
        thumbnail: thumbnailUrl,
        labels: Array.isArray(file._rekognitionLabels) ? file._rekognitionLabels : [],
        labelScores: file._rekognitionScores || {},
      });
    } catch (err) {
      console.error("Error uploading post file:", err);
      throw err;
    }
  }

  return uploadResults;
}

async function uploadDirectMedia(userId, files) {
  const bucketName = process.env.S3_BUCKET_DM;
  if (!bucketName) throw new Error("S3_BUCKET_DM missing");

  await ensureBucketExists(bucketName);

  const uploadResults = [];
  const filesArray = Array.isArray(files) ? files : [files];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectName = `${userId}/${Date.now()}_${i}_${safeName}`;

    await putObject(bucketName, objectName, file.buffer, file.mimetype);
    uploadResults.push(publicObjectUrl(bucketName, objectName));
  }

  multerUploadsCleanup(filesArray);
  return uploadResults;
}

async function uploadGroupMedia(groupId, conversationId, files) {
  const bucketName = process.env.S3_BUCKET_GROUP_MSG;
  if (!bucketName) throw new Error("S3_BUCKET_GROUP_MSG missing");

  await ensureBucketExists(bucketName);

  const uploadResults = [];
  const filesArray = Array.isArray(files) ? files : [files];

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectName = `${groupId}/${conversationId}/${Date.now()}_${i}_${safeName}`;

    await putObject(bucketName, objectName, file.buffer, file.mimetype);
    uploadResults.push(publicObjectUrl(bucketName, objectName));
  }

  multerUploadsCleanup(filesArray);
  return uploadResults;
}

async function uploadGroupDP(groupId, file) {
  const bucketName = process.env.S3_BUCKET_GROUP_DP;
  if (!bucketName) throw new Error("S3_BUCKET_GROUP_DP missing");

  await ensureBucketExists(bucketName);

  if (!file?.buffer) throw new Error("Invalid DP file");
  if (!file?.originalname) throw new Error("Invalid DP file originalname");

  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectName = `${groupId}/${Date.now()}_${safeName}`;

  await putObject(bucketName, objectName, file.buffer, file.mimetype);
  multerUploadsCleanup(file);
  return [publicObjectUrl(bucketName, objectName)];
}

async function uploadProfilePic(userId, file) {
  const bucketName = process.env.S3_BUCKET_PROFILE || process.env.S3_BUCKET_POSTS;
  if (!bucketName) throw new Error("S3_BUCKET_PROFILE or S3_BUCKET_POSTS missing in .env");
  if (!file?.buffer) throw new Error("Invalid profile file");
  if (!file?.originalname) throw new Error("Invalid profile filename");

  await ensureBucketExists(bucketName);

  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectName = `${userId}/profile/${Date.now()}_${safeName}`;

  await putObject(bucketName, objectName, file.buffer, file.mimetype || "image/jpeg");
  return publicObjectUrl(bucketName, objectName);
}

module.exports = {
  s3,
  publicObjectUrl,
  uploadPostOrReel,
  uploadDirectMedia,
  uploadGroupDP,
  uploadGroupMedia,
  uploadProfilePic,
};
