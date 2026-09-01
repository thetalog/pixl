const {
  PERMISSION_KEYS,
  ROLE_RANKS,
  SYSTEM_ROLE_KEYS,
  isKnownPermission,
  permissionsForRoleKey,
  HIGH_RISK_IMPERSONATION_BLOCKLIST,
  unique,
} = require("./permissions");

function roleKeyOf(user) {
  return String(user?.roleKey || "USER").toUpperCase();
}

function rankOf(userOrKey) {
  if (userOrKey == null) return 0;
  if (typeof userOrKey === "string") {
    return Number(ROLE_RANKS[userOrKey] ?? 0);
  }
  if (typeof userOrKey.rank === "number") return userOrKey.rank;
  const key = roleKeyOf(userOrKey);
  return Number(ROLE_RANKS[key] ?? userOrKey.roleRank ?? 0);
}

function isStaff(user) {
  const key = roleKeyOf(user);
  return key !== "USER" && Boolean(key);
}

function resolvePermissions(user, roleRecord) {
  if (!user) return [];
  const key = roleKeyOf(user);
  if (key === "SUPER_ADMIN") return [...PERMISSION_KEYS];

  const fromRole = Array.isArray(roleRecord?.permissions)
    ? roleRecord.permissions
    : permissionsForRoleKey(key);
  const extra = Array.isArray(user.directPermissions) ? user.directPermissions : [];
  const denied = new Set(Array.isArray(user.deniedPermissions) ? user.deniedPermissions : []);
  return unique([...fromRole, ...extra].filter((p) => isKnownPermission(p) && !denied.has(p)));
}

function hasPermission(user, permission, roleRecord) {
  if (!user || !permission) return false;
  if (roleKeyOf(user) === "SUPER_ADMIN") return isKnownPermission(permission) || permission === "*";
  const perms = user.resolvedPermissions || resolvePermissions(user, roleRecord);
  if (permission === "*") return perms.length > 0;
  return perms.includes(permission);
}

function hasAnyPermission(user, permissions, roleRecord) {
  return (permissions || []).some((p) => hasPermission(user, p, roleRecord));
}

function canAssignRole(actor, targetRoleKey) {
  const next = String(targetRoleKey || "").toUpperCase();
  if (!next) return false;
  if (roleKeyOf(actor) === "SUPER_ADMIN") return true;
  if (next === "SUPER_ADMIN") return false;
  return rankOf(actor) > Number(ROLE_RANKS[next] ?? 0);
}

function canModifyStaff(actor, target) {
  if (!actor || !target) return false;
  if (String(actor.id) === String(target.id)) return false;
  if (roleKeyOf(actor) === "SUPER_ADMIN") return roleKeyOf(target) !== "SUPER_ADMIN" || true;
  return rankOf(actor) > rankOf(target);
}

function assertCanActOnUser(actor, target, { allowSelf = false } = {}) {
  if (!target) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  if (!allowSelf && String(actor.id) === String(target.id)) {
    const err = new Error("You cannot perform this action on your own account");
    err.status = 403;
    err.code = "SELF_ACTION_DENIED";
    throw err;
  }
  if (rankOf(actor) <= rankOf(target) && roleKeyOf(actor) !== "SUPER_ADMIN") {
    const err = new Error("Cannot act on a peer or higher-privileged account");
    err.status = 403;
    err.code = "PRIVILEGE_ESCALATION";
    throw err;
  }
  if (roleKeyOf(target) === "SUPER_ADMIN" && roleKeyOf(actor) !== "SUPER_ADMIN") {
    const err = new Error("Only a super admin can act on a super admin");
    err.status = 403;
    err.code = "PRIVILEGE_ESCALATION";
    throw err;
  }
}

function assertCanAssignRole(actor, nextRoleKey) {
  if (!canAssignRole(actor, nextRoleKey)) {
    const err = new Error("You cannot assign that role");
    err.status = 403;
    err.code = "PRIVILEGE_ESCALATION";
    throw err;
  }
}

function assertNotImpersonatingHighRisk(req, permission) {
  if (!req?.impersonating) return;
  if (HIGH_RISK_IMPERSONATION_BLOCKLIST.includes(permission)) {
    const err = new Error("This action is blocked while impersonating");
    err.status = 403;
    err.code = "IMPERSONATION_BLOCKED";
    throw err;
  }
}

function staffCapabilities(user, roleRecord) {
  const permissions = resolvePermissions(user, roleRecord);
  return {
    roleKey: roleKeyOf(user),
    rank: rankOf(user),
    isStaff: isStaff(user),
    permissions,
    can: Object.fromEntries(PERMISSION_KEYS.map((key) => [key, permissions.includes(key) || roleKeyOf(user) === "SUPER_ADMIN"])),
  };
}

function pickAllowedBody(body, allowedKeys) {
  const out = {};
  const src = body && typeof body === "object" ? body : {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(src, key)) {
      out[key] = src[key];
    }
  }
  return out;
}

module.exports = {
  roleKeyOf,
  rankOf,
  isStaff,
  resolvePermissions,
  hasPermission,
  hasAnyPermission,
  canAssignRole,
  canModifyStaff,
  assertCanActOnUser,
  assertCanAssignRole,
  assertNotImpersonatingHighRisk,
  staffCapabilities,
  pickAllowedBody,
  SYSTEM_ROLE_KEYS,
};
