const jwt = require("jsonwebtoken");

function liveSecret() {
  return process.env.LIVESTREAM_JWT_SECRET || process.env.JWT_SECRET_KEY;
}

function signLiveToken({ user, streamId, pixlStreamId, role, permissions }) {
  const secret = liveSecret();
  if (!secret) {
    throw new Error("LIVESTREAM_JWT_SECRET is not configured");
  }
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      userName: user.userName,
      name: user.name,
      profilePic: user.profilePic || "",
      streamId,
      pixlStreamId,
      role,
      permissions,
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "2h",
      issuer: "pixl-node",
      audience: "pixl-livestream",
    }
  );
}

const HOST_PERMISSIONS = [
  "CREATE_STREAM",
  "START_STREAM",
  "END_STREAM",
  "PUBLISH",
  "JOIN_STREAM",
  "LEAVE_STREAM",
  "COMMENT",
  "LIKE",
  "MUTE_VIEWER",
  "REMOVE_VIEWER",
  "DELETE_COMMENT",
];

const VIEWER_PERMISSIONS = ["JOIN_STREAM", "LEAVE_STREAM", "COMMENT", "LIKE"];

const MODERATOR_PERMISSIONS = [
  "JOIN_STREAM",
  "LEAVE_STREAM",
  "COMMENT",
  "LIKE",
  "MUTE_VIEWER",
  "REMOVE_VIEWER",
  "DELETE_COMMENT",
];

function permissionsFor(role) {
  if (role === "HOST" || role === "ADMIN") return HOST_PERMISSIONS;
  if (role === "MODERATOR") return MODERATOR_PERMISSIONS;
  return VIEWER_PERMISSIONS;
}

module.exports = {
  signLiveToken,
  permissionsFor,
  HOST_PERMISSIONS,
  VIEWER_PERMISSIONS,
};
