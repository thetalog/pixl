const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const live = require("../../lib/live/livestreamClient");

test("talks to the Java internal API and unwraps errors", async () => {
  process.env.LIVE_INTERNAL_SECRET = "secret";
  const server = http.createServer((req, res) => {
    if (req.headers["x-internal-secret"] !== "secret") {
      res.writeHead(401);
      res.end(JSON.stringify({ message: "nope" }));
      return;
    }
    if (req.method === "POST" && req.url === "/internal/v1/streams") {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        stream: { streamId: "s1", pixlStreamId: "p1", status: "CREATED", title: "Hi" },
        session: { token: "t", signalingUrl: "ws://localhost:8085/ws/live" },
      }));
      return;
    }
    res.writeHead(404);
    res.end("{}");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  process.env.LIVESTREAM_SERVICE_URL = `http://127.0.0.1:${port}`;
  try {
    const created = await live.createStream({
      pixlStreamId: "p1",
      hostUserId: "u1",
      hostUsername: "alice",
      title: "Hi",
    });
    assert.equal(created.stream.streamId, "s1");
    const err = live.unwrapAxios({ response: { status: 503, data: { message: "Media layer unavailable" } } });
    assert.equal(err.status, 503);
    assert.equal(err.message, "Media layer unavailable");
    const authErr = live.unwrapAxios({ response: { status: 401, data: { message: "Invalid internal secret" } } });
    assert.equal(authErr.status, 503);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
