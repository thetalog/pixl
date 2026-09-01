const express = require("express");
const svc = require("../lib/admin/service");
const { ok, fromError } = require("../lib/admin/respond");
const prisma = require("../lib/prisma");
const { parsePage } = require("../lib/admin/respond");
const { rateLimit } = require("../lib/admin/rateLimit");

const router = express.Router();
const limit = rateLimit({ prefix: "appeal", limit: 10, windowMs: 60_000 });

router.get("/", async (req, res) => {
  try {
    const { page, limit: take, skip } = parsePage(req.query);
    const [total, items] = await Promise.all([
      prisma.appeal.count({ where: { userId: req.user.id } }),
      prisma.appeal.findMany({
        where: { userId: req.user.id },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return ok(res, { items, page, limit: take, total, pages: Math.ceil(total / take) });
  } catch (error) {
    return fromError(res, error);
  }
});

router.post("/", limit, async (req, res) => {
  try {
    const data = await svc.createAppeal(req, req.body || {});
    return ok(res, data);
  } catch (error) {
    return fromError(res, error, "Could not submit appeal");
  }
});

module.exports = router;
