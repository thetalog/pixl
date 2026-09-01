const SENSITIVE_USER_FIELDS = [
  "password",
  "enteredPassword",
  "fcmToken",
  "directPermissions",
  "deniedPermissions",
];

function sanitizeUser(user, { includeStaff = false } = {}) {
  if (!user || typeof user !== "object") return null;
  const out = { ...user };
  for (const field of SENSITIVE_USER_FIELDS) {
    delete out[field];
  }
  if (!includeStaff) {
    delete out.deniedPermissions;
  }
  return out;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    userName: user.userName,
    name: user.name,
    profilePic: user.profilePic,
    profileVisibility: user.profileVisibility,
    isEmailVerified: user.isEmailVerified,
    accountStatus: user.accountStatus || "ACTIVE",
    roleKey: user.roleKey || "USER",
    createdAt: user.createdAt,
    bio: user.bio,
    website: user.website,
  };
}

function staffUserSummary(user) {
  if (!user) return null;
  return {
    id: user.id,
    userName: user.userName,
    name: user.name,
    email: user.email,
    profilePic: user.profilePic,
    roleKey: user.roleKey || "USER",
    accountStatus: user.accountStatus || "ACTIVE",
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    suspendedUntil: user.suspendedUntil,
    livePrivilegesRevoked: Boolean(user.livePrivilegesRevoked),
    commentsLocked: Boolean(user.commentsLocked),
    deletedAt: user.deletedAt || null,
    postsCount: user.postsCount,
  };
}

module.exports = {
  sanitizeUser,
  publicUser,
  staffUserSummary,
  SENSITIVE_USER_FIELDS,
};
