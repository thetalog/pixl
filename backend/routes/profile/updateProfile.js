const express = require("express");
const router = express.Router();
const { signupController } = require("../../controller/signup");

router.put("/update-pofile", async (req, res, next) => {
  try {
    const responseFromController = await signupController(req.body);
    res.status(responseFromController.status).json({
      message: responseFromController.message,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something went wrong.",
    });
  }
});

module.exports = router;
