const express = require("express");
const svc = require("../lib/admin/service");
const { ok, fromError } = require("../lib/admin/respond");
const { rateLimit } = require("../lib/admin/rateLimit");

const router = express.Router();
const limit = rateLimit({ prefix: "report", limit: 20, windowMs: 60_000 });

router.post("/", limit, async (req, res) => {
  try {
    const data = await svc.createReport(req, req.body || {});
    return ok(res, data);
  } catch (error) {
    return fromError(res, error, "Could not submit report");
  }
});

module.exports = router;
