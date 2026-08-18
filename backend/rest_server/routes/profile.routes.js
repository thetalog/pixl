const express = require("express");
const multer = require("multer");
const { updateProfileController } = require("../controller/profile/updateProfile");
const { updateProfilePictureController } = require("../controller/profile/updatePicture");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/update", updateProfileController);
router.post("/picture", upload.single("file"), updateProfilePictureController);

module.exports = router;
