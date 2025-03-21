const AWS = require("aws-sdk");
const fs = require("fs");

function multerUploadsCleanup(files) {
  if (Array.isArray(files)) {
    for (const file of files) {
      // Remove the file from the uploads folder
      try {
        fs.unlinkSync(file.path);
        console.log("✅ File deleted successfully!", file.path);
      } catch (err) {
        console.error("❌ Error deleting file:", err);
      }
    }
  } else {
    // Remove the single file from the uploads folder
    try {
      fs.unlinkSync(files.path);
      console.log("✅ File deleted successfully!", files.path);
    } catch (err) {
      console.error("❌ Error deleting file:", err);
    }
  }
}

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

  if (Array.isArray(files)) {
    let count = 0;
    for (const file of files) {
      const uploadParams = {
        Bucket: bucketName,
        Key: `${userId}/${postCount + 1}/_${count}_${file.originalname}`, // File path inside MinIO
        Body: fs.createReadStream(file.path) || "",
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
  } else {
    const uploadParams = {
      Bucket: bucketName,
      Key: `${userId}/${postCount + 1}/_${files.originalname}`, // File path inside MinIO
      Body: fs.createReadStream(files.path) || "",
      ContentType: files.mimetype, // Set proper content type
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
  }

  multerUploadsCleanup(files);
  return uploadResults;
}

module.exports = { uploadFilesToMinIO };
