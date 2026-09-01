const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isAccountBlocked, hasFeatureRestriction } = require("../../lib/admin/restrictions");
const { parsePage, isObjectId } = require("../../lib/admin/respond");

test("banned and suspended accounts are blocked", () => {
  assert.equal(isAccountBlocked({ accountStatus: "ACTIVE" }).blocked, false);
  assert.equal(isAccountBlocked({ accountStatus: "BANNED" }).code, "ACCOUNT_BANNED");
  assert.equal(isAccountBlocked({ profileVisibility: "BANNED" }).code, "ACCOUNT_BANNED");
  assert.equal(isAccountBlocked({ accountStatus: "SUSPENDED" }).code, "ACCOUNT_SUSPENDED");
  const expired = isAccountBlocked({ accountStatus: "SUSPENDED", suspendedUntil: new Date(Date.now() - 1000) });
  assert.equal(expired.blocked, false);
});

test("feature restrictions and live privilege flags", () => {
  assert.equal(hasFeatureRestriction({ livePrivilegesRevoked: true }, "livestream"), true);
  assert.equal(hasFeatureRestriction({ commentsLocked: true }, "comments"), true);
  assert.equal(hasFeatureRestriction({ featureRestrictions: { uploads: true } }, "uploads"), true);
  assert.equal(hasFeatureRestriction({}, "uploads"), false);
});

test("pagination is server-side and capped", () => {
  assert.deepEqual(parsePage({ page: "2", limit: "50" }), { page: 2, limit: 50, skip: 50 });
  assert.equal(parsePage({ limit: "999" }).limit, 100);
  assert.equal(parsePage({ page: "-3" }).page, 1);
  assert.equal(isObjectId("64b0c0c0c0c0c0c0c0c0c0c0"), true);
  assert.equal(isObjectId("not-an-id"), false);
});
