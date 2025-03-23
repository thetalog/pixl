const Minio = require("minio");
const fs = require("fs");

// Function to pause execution (useful after creating a bucket)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Initialize MinIO Client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT, 10) || 9000, // Defaults to 9000
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

// Function to delete uploaded files locally
function multerUploadsCleanup(files) {
  const filesArray = Array.isArray(files) ? files : [files];

  for (const file of filesArray) {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log("✅ File deleted successfully!", file.path);
      }
    } catch (err) {
      console.error("❌ Error deleting file:", err);
    }
  }
}

// Function to ensure the bucket exists
async function ensureBucketExists(bucketName) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      console.log(`⚠️ Bucket "${bucketName}" does not exist. Creating...`);
      await minioClient.makeBucket(bucketName);
      console.log(`✅ Bucket "${bucketName}" created successfully.`);
      await sleep(2000); // Delay to ensure bucket is ready
    }
  } catch (err) {
    console.error("❌ Error ensuring bucket exists:", err);
    throw err;
  }
}

// Function to upload files to MinIO
async function uploadFilesToMinIO(userId, postCount, files) {
  const bucketName = process.env.MINIO_POSTS_BUCKET;
  const uploadResults = [];
  await ensureBucketExists(bucketName);

  const filesArray = Array.isArray(files) ? files : [files];

  for (let count = 0; count < filesArray.length; count++) {
    const file = filesArray[count];
    const objectName = `${userId}/${postCount + 1}/_${count}_${file.originalname}`;

    try {
      await minioClient.fPutObject(bucketName, objectName, file.path, {
        "Content-Type": file.mimetype,
      });
      const fileUrl = `${process.env.MINIO_PUBLIC_URL}/${bucketName}/${objectName}`;
      console.log("✅ File uploaded successfully!", fileUrl);
      uploadResults.push(fileUrl);
    } catch (err) {
      console.error("❌ Error uploading file:", err);
      throw err;
    }
  }

  // Cleanup uploaded files locally
  multerUploadsCleanup(files);

  return uploadResults;
}

module.exports = { uploadFilesToMinIO };
