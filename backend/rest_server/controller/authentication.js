const jwt = require("jsonwebtoken");
const { getUserByEmail } = require("../database/auth/user");
const { resolvePermissions, isStaff } = require("../lib/admin/authorize");
const prisma = require("../lib/prisma");

async function loadRole(roleKey) {
  if (!roleKey || roleKey === "USER") return null;
  try {
    return await prisma.role.findUnique({ where: { key: roleKey } });
  } catch {
    return null;
  }
}

async function authenticationController(authorizationToken) {
  try {
    const secretKey = process.env.JWT_SECRET_KEY;

    if (!secretKey) {
      console.error("[auth] JWT_SECRET_KEY is not set");
      return { error: true, status: 500, message: "Server auth is not configured." };
    }

    if (!authorizationToken) {
      return { error: true, status: 401, message: "Token missing!" };
    }

    const token = authorizationToken.startsWith("Bearer ")
      ? authorizationToken.split(" ")[1]
      : authorizationToken;

    if (!token) {
      return { error: true, status: 401, message: "Invalid token!" };
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      console.log("JWT VERIFY FAILED:", err.message);
      return { error: true, status: 401, message: "Invalid or expired token!" };
    }

    if (!decoded?.email || !decoded?.name) {
      return { error: true, status: 401, message: "Invalid token payload!" };
    }

    const userResponse = await getUserByEmail(decoded.email);

    if (userResponse?.error) {
      return { error: true, status: 401, message: "User not found!" };
    }

    const user = userResponse.details;
    const tokenSid = Number(decoded.sid || 0);
    const userSid = Number(user.sessionVersion || 0);
    if (tokenSid !== userSid) {
      return { error: true, status: 401, message: "Session has been revoked. Please sign in again." };
    }

    const role = await loadRole(user.roleKey);
    user.resolvedPermissions = resolvePermissions(user, role);
    user.roleRank = role?.rank;

    let impersonator = null;
    if (decoded.impersonatorId && decoded.impersonationId) {
      const actor = await prisma.user.findUnique({ where: { id: decoded.impersonatorId } });
      const session = await prisma.impersonationSession.findUnique({
        where: { id: decoded.impersonationId },
      });
      if (!actor || !isStaff(actor) || !session || !session.active || session.targetId !== user.id) {
        return { error: true, status: 401, message: "Impersonation session is no longer valid." };
      }
      impersonator = actor;
      impersonator.resolvedPermissions = resolvePermissions(actor, await loadRole(actor.roleKey));
    }

    return {
      error: false,
      status: 200,
      message: "Authorized!",
      details: user,
      decoded,
      impersonator,
      impersonationId: decoded.impersonationId || null,
    };
  } catch (error) {
    console.error("[auth] unexpected error:", error);
    return {
      error: true,
      status: 500,
      message: "Authentication failed. Please sign in again.",
    };
  }
}

module.exports = { authenticationController };
