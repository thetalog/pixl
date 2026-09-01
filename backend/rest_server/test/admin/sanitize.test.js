const { test } = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeUser, publicUser } = require("../../lib/admin/sanitize");

test("password and tokens are stripped from admin and profile payloads", () => {
  const raw = {
    id: "1",
    userName: "alice",
    password: "hash",
    fcmToken: "secret",
    email: "a@b.c",
    roleKey: "USER",
  };
  const clean = sanitizeUser(raw);
  assert.equal(clean.password, undefined);
  assert.equal(clean.fcmToken, undefined);
  assert.equal(clean.userName, "alice");
  const pub = publicUser(raw);
  assert.equal(pub.password, undefined);
  assert.equal(pub.email, undefined);
});
