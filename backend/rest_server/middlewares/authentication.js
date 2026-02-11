const { authenticationController } = require("../controller/authentication");

async function authenticationMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];

  const result = await authenticationController(authHeader);
  if (result.error) {
    return res.status(result.status).json({
      message: result.message,
    });
  }
  req.user = result?.details;
  next();
}

module.exports = { authenticationMiddleware };
