const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { signLiveToken, permissionsFor } = require("../../lib/live/liveToken");

test("mints a short-lived livestream token for the Java service", () => {
  process.env.LIVESTREAM_JWT_SECRET = "unit-test-secret-unit-test-secret";
  const token = signLiveToken({
    user: { id: "u1", email: "a@b.com", userName: "alice", name: "Alice", profilePic: "" },
    streamId: "java-1",
    pixlStreamId: "mongo-1",
    role: "HOST",
    permissions: permissionsFor("HOST"),
  });
  const decoded = jwt.verify(token, process.env.LIVESTREAM_JWT_SECRET, {
    issuer: "pixl-node",
    audience: "pixl-livestream",
  });
  assert.equal(decoded.sub, "u1");
  assert.equal(decoded.role, "HOST");
  assert.ok(decoded.permissions.includes("PUBLISH"));
  assert.equal(decoded.streamId, "java-1");
});

test("viewers cannot publish or end", () => {
  const perms = permissionsFor("VIEWER");
  assert.ok(perms.includes("COMMENT"));
  assert.equal(perms.includes("PUBLISH"), false);
  assert.equal(perms.includes("END_STREAM"), false);
});
