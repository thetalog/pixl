const express = require("express");
const router = express.Router();
const { signupSchema } = require("./validator");
const { signupController } = require("../../controller/signup");

router.post(
  "/signup",
  (req, res, next) => {
    const isValidate = signupSchema.validate(req.body);
    if (isValidate?.error) {
      res.status(400).json({ message: "Validation Error" });
    } else {
      next();
    }
  },
  async (req, res) => {
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
  }
);

module.exports = router;
