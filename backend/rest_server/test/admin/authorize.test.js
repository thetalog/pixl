const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  PERMISSION_KEYS,
  permissionsForRoleKey,
  isKnownPermission,
  isDangerousPermission,
  ROLE_RANKS,
  HIGH_RISK_IMPERSONATION_BLOCKLIST,
} = require("../../lib/admin/permissions");
const {
  hasPermission,
  resolvePermissions,
  canAssignRole,
  assertCanActOnUser,
  assertCanAssignRole,
  assertNotImpersonatingHighRisk,
  isStaff,
  rankOf,
  pickAllowedBody,
} = require("../../lib/admin/authorize");

function user(roleKey, extra = {}) {
  return { id: extra.id || "u1", roleKey, directPermissions: extra.direct || [], deniedPermissions: extra.denied || [], resolvedPermissions: extra.resolved };
}

test("system roles receive the expected permission sets", () => {
  assert.equal(permissionsForRoleKey("SUPER_ADMIN").length, PERMISSION_KEYS.length);
  assert.ok(permissionsForRoleKey("ADMIN").includes("users.ban"));
  assert.ok(permissionsForRoleKey("MODERATOR").includes("livestreams.stop"));
  assert.equal(permissionsForRoleKey("MODERATOR").includes("admins.create"), false);
  assert.equal(permissionsForRoleKey("MODERATOR").includes("feature_flags.update"), false);
  assert.equal(permissionsForRoleKey("SUPPORT").includes("users.ban"), false);
  assert.ok(permissionsForRoleKey("ANALYST").includes("analytics.read"));
  assert.equal(permissionsForRoleKey("ANALYST").includes("content.remove"), false);
  assert.deepEqual(permissionsForRoleKey("USER"), []);
});

test("direct grants and denials compose onto the role", () => {
  const mod = user("MODERATOR", { direct: ["analytics.read"], denied: ["livestreams.stop"] });
  const perms = resolvePermissions(mod);
  assert.ok(perms.includes("analytics.read"));
  assert.equal(perms.includes("livestreams.stop"), false);
  assert.equal(isKnownPermission("not.a.perm"), false);
  assert.ok(isDangerousPermission("users.ban"));
});

test("unknown permissions from the client are ignored", () => {
  const perms = resolvePermissions(user("MODERATOR", { direct: ["not.real", "users.ban"] }));
  assert.equal(perms.includes("not.real"), false);
  assert.ok(perms.includes("users.ban"));
});

test("privilege escalation: admin cannot grant super admin", () => {
  const admin = user("ADMIN", { id: "admin" });
  assert.equal(canAssignRole(admin, "SUPER_ADMIN"), false);
  assert.equal(canAssignRole(admin, "MODERATOR"), true);
  assert.throws(() => assertCanAssignRole(admin, "SUPER_ADMIN"), (err) => err.status === 403);
  const superAdmin = user("SUPER_ADMIN", { id: "root" });
  assert.equal(canAssignRole(superAdmin, "ADMIN"), true);
});

test("staff cannot act on peers or themselves", () => {
  const mod = user("MODERATOR", { id: "m1" });
  const admin = user("ADMIN", { id: "a1" });
  assert.throws(() => assertCanActOnUser(mod, admin), (err) => err.code === "PRIVILEGE_ESCALATION");
  assert.throws(() => assertCanActOnUser(mod, user("MODERATOR", { id: "m2" })), (err) => err.code === "PRIVILEGE_ESCALATION");
  assert.throws(() => assertCanActOnUser(mod, user("MODERATOR", { id: "m1" })), (err) => err.code === "SELF_ACTION_DENIED");
  assert.doesNotThrow(() => assertCanActOnUser(admin, user("USER", { id: "u9" })));
});

test("impersonation blocks high-risk staff mutations", () => {
  const req = { impersonating: true };
  assert.throws(
    () => assertNotImpersonatingHighRisk(req, "users.ban"),
    (err) => err.code === "IMPERSONATION_BLOCKED"
  );
  assert.doesNotThrow(() => assertNotImpersonatingHighRisk(req, "users.read"));
  assert.ok(HIGH_RISK_IMPERSONATION_BLOCKLIST.includes("feature_flags.update"));
});

test("hasPermission never trusts a client-supplied can map", () => {
  const spoofed = { id: "u", roleKey: "USER", can: { "users.ban": true }, permissions: ["users.ban"] };
  assert.equal(hasPermission(spoofed, "users.ban"), false);
  assert.equal(isStaff(spoofed), false);
  assert.equal(rankOf(spoofed), ROLE_RANKS.USER);
});

test("mass assignment helper only copies allowlisted keys", () => {
  const body = { name: "ok", rank: 10, isSystem: true, permissions: ["users.read"] };
  assert.deepEqual(pickAllowedBody(body, ["name", "permissions"]), { name: "ok", permissions: ["users.read"] });
});

test("requirePermission middleware rejects non-staff", async () => {
  const { requirePermission } = require("../../middlewares/requirePermission");
  const mw = requirePermission("users.ban");
  const req = { user: user("USER"), originalUrl: "/admin/users" };
  let status;
  let payload;
  const res = {
    status(code) {
      status = code;
      return this;
    },
    json(body) {
      payload = body;
      return body;
    },
  };
  let nextCalled = false;
  mw(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(status, 403);
  assert.equal(payload.code, "FORBIDDEN");
});

test("impersonated sessions can hit impersonation stop without staff role", () => {
  const { requireStaff } = require("../../middlewares/requirePermission");
  const req = {
    user: user("USER"),
    impersonating: true,
    originalUrl: "/admin/impersonation/stop",
  };
  let nextCalled = false;
  requireStaff(req, { status() { return this; }, json() {} }, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});
