const express = require("express");
const { checkUsernameExist } = require("../../controller/checkUsernameExist");

const router = express.Router();

router.post("/check-username", checkUsernameExist);

module.exports = router;