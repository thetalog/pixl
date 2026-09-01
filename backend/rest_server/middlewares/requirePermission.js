const { hasPermission, isStaff, assertNotImpersonatingHighRisk } = require("../lib/admin/authorize");
const { fail } = require("../lib/admin/respond");
const { logPrivileged } = require("../lib/admin/audit");

function requireStaff(req, res, next) {
  const path = String(req.originalUrl || req.path || "");
  if (req.impersonating && path.includes("/admin/impersonation")) {
    return next();
  }
  if (!req.user || !isStaff(req.user)) {
    logPrivileged("permission_denied", {
      path: req.originalUrl,
      actorId: req.user?.id || null,
      reason: "not_staff",
    });
    return fail(res, 403, "Staff access required", "FORBIDDEN");
  }
  return next();
}

function requirePermission(...permissions) {
  const needed = permissions.flat().filter(Boolean);
  return function permissionMiddleware(req, res, next) {
    if (!req.user) {
      return fail(res, 401, "Unauthorized", "UNAUTHORIZED");
    }
    if (!isStaff(req.user)) {
      logPrivileged("permission_denied", {
        path: req.originalUrl,
        actorId: req.user.id,
        permissions: needed,
        reason: "not_staff",
      });
      return fail(res, 403, "Staff access required", "FORBIDDEN");
    }
    const allowed = needed.some((p) => hasPermission(req.user, p));
    if (!allowed) {
      logPrivileged("permission_denied", {
        path: req.originalUrl,
        actorId: req.user.id,
        role: req.user.roleKey,
        permissions: needed,
      });
      return fail(res, 403, "You do not have permission to perform this action", "FORBIDDEN");
    }
    try {
      for (const p of needed) {
        if (hasPermission(req.user, p)) {
          assertNotImpersonatingHighRisk(req, p);
        }
      }
    } catch (error) {
      return fail(res, error.status || 403, error.message, error.code);
    }
    return next();
  };
}

module.exports = { requireStaff, requirePermission };
