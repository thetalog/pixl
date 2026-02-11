const express = require("express");
const { updateProfileController } = require("../controller/profile/updateProfile");

const router = express.Router();

router.post("/update", updateProfileController);
module.exports = router;