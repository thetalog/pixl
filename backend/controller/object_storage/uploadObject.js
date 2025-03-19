const AWS = require("aws-sdk");

async function uploadFilesToMinIO(userId, postCount, files) {
  const s3 = new AWS.S3({
    endpoint: process.env.MINIO_ENDPOINT,
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
    s3ForcePathStyle: true, // Required for MinIO
    signatureVersion: "v4",
  });

  const bucketName = process.env.MINIO_POSTS_BUCKET;
  const uploadResults = [];

  let count = 0;
  for (const file of files) {
    const uploadParams = {
      Bucket: bucketName,
      Key: `${userId}/${postCount + 1}/_${count}_${file.originalname}`, // File path inside MinIO
      Body: file.buffer || "",
      ContentType: file.mimetype, // Set proper content type
    };

    try {
      const uploadResult = await s3.upload(uploadParams).promise();
      console.log("✅ File uploaded successfully!", uploadResult.Location);
      uploadResults.push(uploadResult.Location);
    } catch (uploadError) {
      if (uploadError.code === "NoSuchBucket") {
        console.warn("⚠️ Bucket does not exist. Creating...");

        // Create the bucket if it does not exist
        await s3.createBucket({ Bucket: bucketName }).promise();
        console.log("✅ Bucket created successfully!");

        // Retry file upload after bucket creation
        const retryResult = await s3.upload(uploadParams).promise();
        console.log(
          "✅ File uploaded after bucket creation!",
          retryResult.Location
        );
        uploadResults.push(retryResult.Location);
      } else {
        console.error("❌ Error uploading file:", uploadError);
        throw uploadError;
      }
    }
    count++;
  }

  return uploadResults;
}

module.exports = { uploadFilesToMinIO };
