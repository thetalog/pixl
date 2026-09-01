const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

test("forceEndStream calls Java internal force-end, not host /end", async () => {
  process.env.LIVE_INTERNAL_SECRET = "secret";
  let seen = null;
  const server = http.createServer((req, res) => {
    seen = { method: req.method, url: req.url, secret: req.headers["x-internal-secret"] };
    let raw = "";
    req.on("data", (c) => { raw += c; });
    req.on("end", () => {
      seen.body = raw ? JSON.parse(raw) : null;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ streamId: "s1", status: "ENDED" }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  process.env.LIVESTREAM_SERVICE_URL = `http://127.0.0.1:${port}`;
  const live = require("../../lib/live/livestreamClient");
  try {
    const result = await live.forceEndStream("s1", "staff-9", "platform_moderation:spam");
    assert.equal(result.status, "ENDED");
    assert.equal(seen.method, "POST");
    assert.equal(seen.url, "/internal/v1/streams/s1/force-end");
    assert.equal(seen.secret, "secret");
    assert.equal(seen.body.actorUserId, "staff-9");
    assert.match(seen.body.reason, /platform_moderation/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
