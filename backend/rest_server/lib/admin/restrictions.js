const { loadFlags, assertFlagOff } = require("./flags");
const { isStaff } = require("./authorize");

function restrictionMap(user) {
  const raw = user?.featureRestrictions;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
  return {};
}

function isAccountBlocked(user) {
  if (!user) return { blocked: true, code: "UNAUTHORIZED", message: "Unauthorized" };
  if (user.deletedAt) {
    return { blocked: true, code: "ACCOUNT_DELETED", message: "This account has been removed." };
  }
  const status = String(user.accountStatus || "ACTIVE").toUpperCase();
  if (status === "BANNED" || user.profileVisibility === "BANNED") {
    return { blocked: true, code: "ACCOUNT_BANNED", message: "This account has been banned." };
  }
  if (status === "SUSPENDED") {
    if (user.suspendedUntil && new Date(user.suspendedUntil) <= new Date()) {
      return { blocked: false };
    }
    return {
      blocked: true,
      code: "ACCOUNT_SUSPENDED",
      message: user.suspendedUntil
        ? `This account is suspended until ${new Date(user.suspendedUntil).toISOString()}.`
        : "This account is suspended.",
      until: user.suspendedUntil || null,
    };
  }
  return { blocked: false };
}

function hasFeatureRestriction(user, feature) {
  if (feature === "livestream" && user?.livePrivilegesRevoked) return true;
  if (feature === "comments" && user?.commentsLocked) return true;
  return Boolean(restrictionMap(user)[feature]);
}

async function assertCanUseApp(user, { path = "", method = "GET", impersonating = false } = {}) {
  const flags = await loadFlags();
  const pathname = String(path).split("?")[0];
  if (flags.maintenance_mode && !isStaff(user) && !impersonating) {
    const err = new Error("Pixl is temporarily unavailable for maintenance.");
    err.status = 503;
    err.code = "MAINTENANCE";
    throw err;
  }

  const block = isAccountBlocked(user);
  if (!block.blocked) return flags;

  const allowed =
    method === "GET" &&
    (pathname.endsWith("/users/profile") ||
      pathname.includes("/users/notifications") ||
      pathname.startsWith("/appeals") ||
      pathname.endsWith("/admin/me") ||
      pathname.includes("/admin/impersonation"));
  const appealWrite = method === "POST" && pathname.includes("/appeals");
  const stopImpersonation = impersonating && pathname.includes("/admin/impersonation");
  if (allowed || appealWrite || stopImpersonation) return flags;

  const err = new Error(block.message);
  err.status = 403;
  err.code = block.code;
  err.until = block.until;
  throw err;
}

async function assertCanPostContent(user) {
  const flags = await loadFlags();
  assertFlagOff(flags, "uploads_disabled", "Uploads are temporarily disabled.");
  if (hasFeatureRestriction(user, "uploads")) {
    const err = new Error("Your account is restricted from uploading content.");
    err.status = 403;
    err.code = "FEATURE_RESTRICTED";
    throw err;
  }
  return flags;
}

async function assertCanComment(user) {
  const flags = await loadFlags();
  assertFlagOff(flags, "comments_disabled", "Comments are temporarily disabled.");
  if (hasFeatureRestriction(user, "comments")) {
    const err = new Error("Your account is restricted from commenting.");
    err.status = 403;
    err.code = "FEATURE_RESTRICTED";
    throw err;
  }
  return flags;
}

async function assertCanGoLive(user) {
  const flags = await loadFlags();
  assertFlagOff(flags, "livestreaming_disabled", "Livestreaming is temporarily disabled.");
  if (hasFeatureRestriction(user, "livestream")) {
    const err = new Error("Your livestream privileges have been suspended.");
    err.status = 403;
    err.code = "LIVE_RESTRICTED";
    throw err;
  }
  return flags;
}

async function assertCanRegister() {
  const flags = await loadFlags();
  assertFlagOff(flags, "registrations_disabled", "New registrations are temporarily disabled.");
  return flags;
}

module.exports = {
  restrictionMap,
  isAccountBlocked,
  hasFeatureRestriction,
  assertCanUseApp,
  assertCanPostContent,
  assertCanComment,
  assertCanGoLive,
  assertCanRegister,
};
