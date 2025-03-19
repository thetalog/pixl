const AWS = require("aws-sdk");

function uploadFileToMinIO(userId, postId, file) {
  // MinIO Configuration
  const s3 = new AWS.S3({
    endpoint: process.env.MINIO_ENDPOINT,
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
    s3ForcePathStyle: true, // Required for MinIO
    signatureVersion: "v4",
  });

  // Determine postCount based on file array length
  const postCount = Array.isArray(file) ? file.length : 0;

  // Upload File to MinIO
  const uploadParams = {
    Bucket: process.env.MINIO_POSTS_BUCKET,
    Key: `${userId}/${postId}/${file.originalname}_${postCount}`, // File path inside MinIO
    Body: file.buffer,
  };

  s3.upload(uploadParams, (err, data) => {
    if (err) {
      console.error("Error uploading file:", err);
    } else {
      console.log("File uploaded successfully!", data.Location);
    }
  });
}

module.exports = uploadFileToMinIO;
