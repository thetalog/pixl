function ok(res, data, extra = {}) {
  return res.status(200).json({ error: false, data, ...extra });
}

function created(res, data) {
  return res.status(201).json({ error: false, data });
}

function fail(res, status, message, code) {
  const payload = { error: true, message };
  if (code) payload.code = code;
  return res.status(status).json(payload);
}

function fromError(res, error, fallback = "Something went wrong") {
  const status = Number(error?.status || error?.statusCode || 500);
  const message = status >= 500 ? fallback : error?.message || fallback;
  if (status >= 500) {
    console.error("[admin]", error);
  } else {
    console.warn("[admin]", error?.code || status, error?.message || message);
  }
  return fail(res, status, message, error?.code);
}

function parsePage(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function parseDateRange(query = {}) {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  const range = {};
  if (from && !Number.isNaN(from.getTime())) range.gte = from;
  if (to && !Number.isNaN(to.getTime())) range.lte = to;
  return Object.keys(range).length ? range : null;
}

function isObjectId(value) {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
}

function clientMeta(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  const ip = String(forwarded || req.ip || req.socket?.remoteAddress || "").split(",")[0].trim();
  return {
    ip: ip || null,
    userAgent: req.headers?.["user-agent"] || null,
    requestId: req.requestId || req.headers?.["x-request-id"] || null,
  };
}

module.exports = {
  ok,
  created,
  fail,
  fromError,
  parsePage,
  parseDateRange,
  isObjectId,
  clientMeta,
};
