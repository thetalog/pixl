const express = require("express");
const router = express.Router();
const { loginController } = require("../../controller/login");
const { loginSchema, loginSchemaHeaders } = require("./validator");

router.post(
  "/login",
  (req, res, next) => {
    if (
      loginSchema.validate(req.body)?.error?.details?.length > 0 &&
      loginSchemaHeaders.validate(req.headers?.host)?.error?.details?.length > 0
    )
      return res.status(400).send("Validation failed!");
    next();
  },
  async (req, res) => {
    try {
      req.body["IPAddress"] = req.headers?.host;
      const controllerResponse = await loginController(req.body);
      return res.status(controllerResponse?.status).json({
        message: controllerResponse?.message,
        data: controllerResponse?.data,
      });
    } catch (error) {
      return res.status(500).send({ message: "Something went wrong" });
    }
  }
);

module.exports = router;
