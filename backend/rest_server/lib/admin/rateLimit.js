const windows = new Map();

function allow({ key, limit = 30, windowMs = 60_000 }) {
  const now = Date.now();
  const entry = windows.get(key);
  if (!entry || now - entry.start >= windowMs) {
    windows.set(key, { start: now, count: 1 });
    return { ok: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfterMs: windowMs - (now - entry.start) };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}

function rateLimit({ prefix, limit, windowMs }) {
  return function rateLimitMiddleware(req, res, next) {
    const id = req.user?.id || req.ip || "anon";
    const result = allow({
      key: `${prefix}:${id}`,
      limit,
      windowMs,
    });
    if (!result.ok) {
      res.setHeader("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
      return res.status(429).json({
        error: true,
        message: "Too many requests. Try again shortly.",
        code: "RATE_LIMITED",
      });
    }
    return next();
  };
}

module.exports = { allow, rateLimit };
