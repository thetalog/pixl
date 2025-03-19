const express = require("express");
const router = express.Router();
const { authenticationController } = require("../controller/authentication.js");
async function authenticationMiddleware(req, res, next) {
  try {
    if (req?.headers?.authorization) {
      const response = await authenticationController(
        req?.headers?.authorization
      );
      req.user = response?.user;
      if (response?.status === 200) return next();
      return res.status(response?.status).send(response?.message);
    } else {
      return res.status(401).send("Unauthorized");
    }
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong!",
    });
  }
}
module.exports = { authenticationMiddleware };
