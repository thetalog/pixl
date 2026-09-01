const { authenticationController } = require("../controller/authentication");
const { assertCanUseApp } = require("../lib/admin/restrictions");
const crypto = require("crypto");

async function authenticationMiddleware(req, res, next) {
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);

  const authHeader = req.headers["authorization"];

  const result = await authenticationController(authHeader);
  if (result.error) {
    return res.status(result.status).json({
      message: result.message,
    });
  }
  req.user = result?.details;
  req.authClaims = result?.decoded || null;
  req.impersonator = result?.impersonator || null;
  req.impersonating = Boolean(result?.impersonator);
  req.impersonationId = result?.impersonationId || null;

  try {
    await assertCanUseApp(req.user, {
      path: req.originalUrl || req.path || "",
      method: req.method,
      impersonating: req.impersonating,
    });
  } catch (error) {
    return res.status(error.status || 403).json({
      error: true,
      message: error.message,
      code: error.code,
    });
  }

  next();
}

module.exports = { authenticationMiddleware };
