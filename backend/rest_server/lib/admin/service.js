const prisma = require("../prisma");
const live = require("../live/livestreamClient");
const { notifyUser } = require("../notifyUser");
const { writeAudit, logPrivileged } = require("./audit");
const {
  assertCanActOnUser,
  assertCanAssignRole,
  roleKeyOf,
  rankOf,
  pickAllowedBody,
  hasPermission,
  isStaff,
} = require("./authorize");
const { staffUserSummary, publicUser } = require("./sanitize");
const { parsePage, parseDateRange, isObjectId } = require("./respond");
const {
  QUEUE_STATUSES,
  STRIKE_TYPES,
  DEFAULT_REPORT_CATEGORIES,
  isKnownPermission,
} = require("./permissions");
const { loadFlags, invalidateFlags, DEFAULT_FLAGS } = require("./flags");
const { signJWT } = require("../../controller/jwt");

function httpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function requireReason(reason) {
  const text = String(reason || "").trim();
  if (text.length < 3) throw httpError(400, "A reason is required", "VALIDATION");
  return text.slice(0, 2000);
}

async function getRole(roleKey) {
  if (!roleKey) return null;
  return prisma.role.findUnique({ where: { key: String(roleKey).toUpperCase() } });
}

async function recordAction(req, data) {
  const action = await prisma.moderationAction.create({
    data: {
      type: data.type,
      actorId: req.user.id,
      targetType: data.targetType,
      targetId: String(data.targetId),
      targetUserId: data.targetUserId || null,
      reason: data.reason || null,
      severity: data.severity || null,
      expiresAt: data.expiresAt || null,
      caseId: data.caseId || null,
      reportId: data.reportId || null,
      previousState: data.previousState ?? undefined,
      resultingState: data.resultingState ?? undefined,
    },
  });
  await writeAudit({
    req,
    action: data.auditAction || data.type,
    targetType: data.targetType,
    targetId: data.targetId,
    reason: data.reason,
    before: data.previousState,
    after: data.resultingState,
    caseId: data.caseId,
    reportId: data.reportId,
  });
  logPrivileged(data.auditAction || data.type, {
    actorId: req.user.id,
    targetType: data.targetType,
    targetId: data.targetId,
  });
  return action;
}

async function addStrike(req, { userId, type, reason, severity, expiresAt, reportId, contentType, contentId, notes }) {
  if (!STRIKE_TYPES.includes(type)) throw httpError(400, "Unknown strike type", "VALIDATION");
  return prisma.moderationStrike.create({
    data: {
      userId,
      type,
      reason,
      severity: severity || "MEDIUM",
      expiresAt: expiresAt || null,
      actorId: req.user.id,
      reportId: reportId || null,
      contentType: contentType || null,
      contentId: contentId || null,
      notes: notes || null,
      active: true,
    },
  });
}

async function notifyTarget(userId, message, type = "moderation") {
  if (!userId || !message) return;
  await notifyUser(userId, { message, type });
}

async function optimisticUpdate(model, id, version, data) {
  const where = { id, version: Number(version) };
  const result = await prisma[model].updateMany({
    where,
    data: { ...data, version: { increment: 1 } },
  });
  if (!result.count) {
    throw httpError(409, "This item was updated by another moderator. Refresh and try again.", "CONFLICT");
  }
  return prisma[model].findUnique({ where: { id } });
}

function userWhere(query) {
  const where = {};
  if (query.q) {
    const q = String(query.q).trim();
    where.OR = [
      { userName: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (query.roleKey) where.roleKey = String(query.roleKey).toUpperCase();
  if (query.accountStatus) where.accountStatus = String(query.accountStatus).toUpperCase();
  if (query.verified === "true") where.isEmailVerified = true;
  if (query.verified === "false") where.isEmailVerified = false;
  const created = parseDateRange(query);
  if (created) where.createdAt = created;
  return where;
}

async function dashboard(query) {
  const created = parseDateRange(query);
  const userCreated = created ? { createdAt: created } : {};
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [
    totalUsers,
    newUsers,
    suspendedUsers,
    bannedUsers,
    pendingReports,
    urgentReports,
    pendingCases,
    unresolvedAppeals,
    liveNow,
    recentRemovals,
    recentBans,
    recentModeration,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: userCreated.createdAt ? userCreated : { createdAt: { gte: since30 } } }),
    prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
    prisma.user.count({ where: { OR: [{ accountStatus: "BANNED" }, { profileVisibility: "BANNED" }] } }),
    prisma.report.count({ where: { status: { in: ["NEW", "IN_REVIEW", "NEEDS_INFO", "ESCALATED"] } } }),
    prisma.report.count({ where: { severity: "URGENT", status: { in: ["NEW", "IN_REVIEW", "ESCALATED"] } } }),
    prisma.moderationCase.count({ where: { status: { in: ["NEW", "IN_REVIEW", "NEEDS_INFO", "ESCALATED"] } } }),
    prisma.appeal.count({ where: { status: { in: ["NEW", "IN_REVIEW"] } } }),
    prisma.liveStream.count({ where: { status: { in: ["CREATED", "STARTING", "LIVE"] } } }),
    prisma.moderationAction.findMany({
      where: { type: { in: ["CONTENT_HIDE", "CONTENT_REMOVE", "COMMENT_HIDE", "COMMENT_REMOVE"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.moderationAction.findMany({
      where: { type: { in: ["USER_BAN", "USER_SUSPEND"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.moderationAction.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
  ]);

  const activeUsers = await prisma.user.count({
    where: { lastLoginAt: { gte: since30 }, accountStatus: "ACTIVE", deletedAt: null },
  });

  return {
    kpis: {
      totalUsers,
      activeUsers,
      newUsers,
      suspendedUsers,
      bannedUsers,
      pendingReports,
      urgentReports,
      pendingModerationActions: pendingCases,
      unresolvedAppeals,
      livestreamsLive: liveNow,
    },
    recentContentRemovals: recentRemovals,
    recentBans,
    recentModeration,
  };
}

async function listUsers(query) {
  const { page, limit, skip } = parsePage(query);
  const where = userWhere(query);
  const sortKey = ["createdAt", "userName", "lastLoginAt"].includes(query.sort) ? query.sort : "createdAt";
  const order = query.order === "asc" ? "asc" : "desc";
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortKey]: order },
      select: {
        id: true,
        userName: true,
        name: true,
        email: true,
        profilePic: true,
        roleKey: true,
        accountStatus: true,
        isEmailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        suspendedUntil: true,
        livePrivilegesRevoked: true,
        commentsLocked: true,
        deletedAt: true,
        postsCount: true,
        profileVisibility: true,
      },
    }),
  ]);
  return { items: rows, page, limit, total, pages: Math.ceil(total / limit) };
}

async function getUser(id) {
  if (!isObjectId(id)) throw httpError(400, "Invalid user id", "VALIDATION");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw httpError(404, "User not found");
  const [reports, actions, strikes, appeals, notes, posts, comments, lives, assignments] = await Promise.all([
    prisma.report.findMany({
      where: { OR: [{ targetUserId: id }, { reporterId: id }] },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.moderationAction.findMany({ where: { targetUserId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.moderationStrike.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.appeal.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.moderationNote.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.post.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { media: true },
    }),
    prisma.comment.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.liveStream.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.staffAssignment.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  return {
    user: staffUserSummary(user),
    directPermissions: user.directPermissions || [],
    deniedPermissions: user.deniedPermissions || [],
    featureRestrictions: user.featureRestrictions || {},
    reports,
    moderationHistory: actions,
    strikes,
    appeals,
    notes,
    posts,
    comments,
    livestreams: lives,
    staffAssignments: assignments,
  };
}

async function applyUserAction(req, userId, body) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw httpError(404, "User not found");
  const action = String(body.action || "").toLowerCase();
  const reason = ["note"].includes(action) ? String(body.reason || body.body || "").trim() : requireReason(body.reason);
  const previous = {
    accountStatus: user.accountStatus,
    profileVisibility: user.profileVisibility,
    suspendedUntil: user.suspendedUntil,
    livePrivilegesRevoked: user.livePrivilegesRevoked,
    commentsLocked: user.commentsLocked,
    featureRestrictions: user.featureRestrictions,
    deletedAt: user.deletedAt,
  };

  const need = {
    warn: "moderation.act",
    suspend: "users.suspend",
    ban: "users.ban",
    unban: "users.unban",
    restore: "users.restore",
    delete: "users.delete",
    restrict: "users.suspend",
    revoke_sessions: "users.suspend",
    force_logout: "users.suspend",
    note: "moderation.act",
  };
  const required = need[action];
  if (!required || !hasPermission(req.user, required)) {
    throw httpError(403, "You do not have permission for this user action", "FORBIDDEN");
  }

  let data = {};
  let type = action;
  let notifyMessage = null;
  let strikeType = null;
  let expiresAt = null;

  if (action === "warn") {
    type = "USER_WARN";
    strikeType = "warning";
    notifyMessage = `A moderator issued a warning: ${reason}`;
  } else if (action === "suspend") {
    assertCanActOnUser(req.user, user);
    const days = Number(body.days);
    expiresAt = body.indefinite || !days ? null : new Date(Date.now() + days * 86400000);
    data = {
      accountStatus: "SUSPENDED",
      suspendedUntil: expiresAt,
      sessionVersion: { increment: 1 },
    };
    type = "USER_SUSPEND";
    strikeType = expiresAt ? "temporary_suspension" : "temporary_restriction";
    notifyMessage = expiresAt
      ? `Your account is suspended until ${expiresAt.toISOString()}. Reason: ${reason}`
      : `Your account is suspended. Reason: ${reason}`;
  } else if (action === "ban") {
    assertCanActOnUser(req.user, user);
    data = {
      accountStatus: "BANNED",
      profileVisibility: "BANNED",
      suspendedUntil: null,
      sessionVersion: { increment: 1 },
    };
    type = "USER_BAN";
    strikeType = "permanent_ban";
    notifyMessage = `Your account has been banned. Reason: ${reason}`;
  } else if (action === "unban" || action === "restore") {
    assertCanActOnUser(req.user, user, { allowSelf: false });
    data = {
      accountStatus: "ACTIVE",
      profileVisibility: user.profileVisibility === "BANNED" ? "PRIVATE" : user.profileVisibility,
      suspendedUntil: null,
      deletedAt: null,
    };
    type = action === "unban" ? "USER_UNBAN" : "USER_RESTORE";
    notifyMessage = "Your account access has been restored.";
  } else if (action === "delete") {
    assertCanActOnUser(req.user, user);
    data = {
      deletedAt: new Date(),
      accountStatus: "BANNED",
      profileVisibility: "BANNED",
      sessionVersion: { increment: 1 },
    };
    type = "USER_DELETE";
    notifyMessage = "Your account has been removed.";
  } else if (action === "restrict") {
    assertCanActOnUser(req.user, user);
    const features = body.features && typeof body.features === "object" ? body.features : {};
    data = {
      featureRestrictions: features,
      livePrivilegesRevoked: Boolean(features.livestream),
      commentsLocked: Boolean(features.comments),
    };
    type = "USER_RESTRICT";
    strikeType = "temporary_restriction";
    notifyMessage = `Some features on your account were restricted. Reason: ${reason}`;
  } else if (action === "revoke_sessions" || action === "force_logout") {
    assertCanActOnUser(req.user, user);
    data = { sessionVersion: { increment: 1 } };
    type = "USER_REVOKE_SESSIONS";
  } else if (action === "note") {
    if (!reason) throw httpError(400, "Note body is required", "VALIDATION");
    const note = await prisma.moderationNote.create({
      data: { userId, authorId: req.user.id, body: reason, visibility: body.visibility === "WORKFLOW" ? "WORKFLOW" : "INTERNAL" },
    });
    await writeAudit({ req, action: "MODERATION_NOTE", targetType: "USER", targetId: userId, reason });
    return { note };
  } else {
    throw httpError(400, "Unknown user action", "VALIDATION");
  }

  const updated = Object.keys(data).length
    ? await prisma.user.update({ where: { id: userId }, data })
    : user;
  const recorded = await recordAction(req, {
    type,
    targetType: "USER",
    targetId: userId,
    targetUserId: userId,
    reason,
    caseId: body.caseId,
    reportId: body.reportId,
    previousState: previous,
    resultingState: {
      accountStatus: updated.accountStatus,
      profileVisibility: updated.profileVisibility,
      suspendedUntil: updated.suspendedUntil,
      featureRestrictions: updated.featureRestrictions,
    },
    auditAction: type,
  });
  if (strikeType) {
    await addStrike(req, {
      userId,
      type: strikeType,
      reason,
      severity: body.severity,
      expiresAt,
      reportId: body.reportId,
    });
  }
  if (notifyMessage) await notifyTarget(userId, notifyMessage);
  return { user: staffUserSummary(updated), action: recorded };
}

async function changeUserRole(req, userId, body) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw httpError(404, "User not found");
  const nextRole = String(body.roleKey || "").toUpperCase();
  if (!nextRole) throw httpError(400, "roleKey is required", "VALIDATION");
  const role = await getRole(nextRole);
  if (!role || role.archived) throw httpError(400, "Unknown or archived role", "VALIDATION");
  assertCanActOnUser(req.user, target);
  assertCanAssignRole(req.user, nextRole);
  if (String(req.user.id) === String(userId)) {
    throw httpError(403, "You cannot change your own role", "SELF_ACTION_DENIED");
  }
  if (nextRole === "SUPER_ADMIN" && roleKeyOf(req.user) !== "SUPER_ADMIN") {
    throw httpError(403, "Only a super admin can grant super admin", "PRIVILEGE_ESCALATION");
  }
  if (nextRole === "ADMIN" && !hasPermission(req.user, "admins.create") && !hasPermission(req.user, "admins.edit")) {
    throw httpError(403, "Missing permission to assign administrators", "FORBIDDEN");
  }
  if (["MODERATOR", "SUPPORT", "ANALYST"].includes(nextRole) && !hasPermission(req.user, "moderators.create") && !hasPermission(req.user, "moderators.edit") && !hasPermission(req.user, "admins.edit")) {
    throw httpError(403, "Missing permission to assign this staff role", "FORBIDDEN");
  }

  const previous = { roleKey: target.roleKey };
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { roleKey: nextRole, sessionVersion: { increment: 1 } },
  });
  await prisma.staffAssignment.updateMany({
    where: { userId, active: true },
    data: { active: false, deactivatedAt: new Date() },
  });
  if (nextRole !== "USER") {
    await prisma.staffAssignment.create({
      data: { userId, roleKey: nextRole, assignedById: req.user.id, active: true },
    });
  }
  await recordAction(req, {
    type: "STAFF_ROLE_CHANGE",
    targetType: "USER",
    targetId: userId,
    targetUserId: userId,
    reason: body.reason || `Role changed to ${nextRole}`,
    previousState: previous,
    resultingState: { roleKey: nextRole },
    auditAction: "STAFF_ROLE_CHANGE",
  });
  return { user: staffUserSummary(updated) };
}

async function changeUserPermissions(req, userId, body) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw httpError(404, "User not found");
  assertCanActOnUser(req.user, target);
  const direct = Array.isArray(body.directPermissions) ? body.directPermissions.filter(isKnownPermission) : target.directPermissions;
  const denied = Array.isArray(body.deniedPermissions) ? body.deniedPermissions.filter(isKnownPermission) : target.deniedPermissions;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { directPermissions: direct, deniedPermissions: denied },
  });
  await writeAudit({
    req,
    action: "STAFF_PERMISSIONS_CHANGE",
    targetType: "USER",
    targetId: userId,
    reason: body.reason || "Direct permissions updated",
    before: { directPermissions: target.directPermissions, deniedPermissions: target.deniedPermissions },
    after: { directPermissions: direct, deniedPermissions: denied },
  });
  return { user: staffUserSummary(updated), directPermissions: direct, deniedPermissions: denied };
}

async function createReport(req, body) {
  const targetType = String(body.targetType || "").toUpperCase();
  const targetId = String(body.targetId || "");
  const category = String(body.category || "other").toLowerCase();
  const reason = requireReason(body.reason || body.details || "Reported");
  if (!targetType || !targetId) throw httpError(400, "targetType and targetId are required", "VALIDATION");
  const allowedTypes = ["USER", "POST", "COMMENT", "REEL", "STORY", "LIVESTREAM", "PROFILE"];
  if (!allowedTypes.includes(targetType)) throw httpError(400, "Unsupported report target", "VALIDATION");

  let targetUserId = body.targetUserId || null;
  if (targetType === "USER" || targetType === "PROFILE") targetUserId = targetId;
  if (targetType === "POST") {
    const post = await prisma.post.findUnique({ where: { id: targetId } });
    if (post) targetUserId = post.userId;
  }
  if (targetType === "COMMENT") {
    const comment = await prisma.comment.findUnique({ where: { id: targetId } });
    if (comment) targetUserId = comment.userId;
  }
  if (targetType === "REEL") {
    const reel = await prisma.reels.findUnique({ where: { id: targetId } });
    if (reel) targetUserId = reel.userId;
  }
  if (targetType === "STORY") {
    const story = await prisma.stories.findUnique({ where: { id: targetId } });
    if (story) targetUserId = story.userId;
  }
  if (targetType === "LIVESTREAM") {
    const liveRow = await prisma.liveStream.findUnique({ where: { id: targetId } });
    if (liveRow) targetUserId = liveRow.userId;
  }

  const severity = ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(String(body.severity || "").toUpperCase())
    ? String(body.severity).toUpperCase()
    : category === "self_harm" || category === "violence" ? "HIGH" : "MEDIUM";

  const report = await prisma.report.create({
    data: {
      reporterId: req.user.id,
      targetType,
      targetId,
      targetUserId,
      category,
      severity,
      status: "NEW",
      reason,
      details: body.details ? String(body.details).slice(0, 4000) : null,
      evidence: body.evidence ?? undefined,
    },
  });
  const slaHours = severity === "URGENT" ? 2 : severity === "HIGH" ? 8 : 24;
  const kase = await prisma.moderationCase.create({
    data: {
      source: "REPORT",
      status: "NEW",
      priority: severity === "URGENT" ? "URGENT" : severity === "HIGH" ? "HIGH" : "NORMAL",
      severity,
      category,
      targetType,
      targetId,
      targetUserId,
      reportId: report.id,
      slaDueAt: new Date(Date.now() + slaHours * 3600000),
    },
  });
  await prisma.report.update({ where: { id: report.id }, data: { caseId: kase.id } });
  return { report: { ...report, caseId: kase.id }, case: kase };
}

function reportWhere(query) {
  const where = {};
  if (query.status) where.status = String(query.status).toUpperCase();
  if (query.category) where.category = String(query.category).toLowerCase();
  if (query.severity) where.severity = String(query.severity).toUpperCase();
  if (query.assigneeId) where.assigneeId = query.assigneeId;
  if (query.targetUserId) where.targetUserId = query.targetUserId;
  if (query.reporterId) where.reporterId = query.reporterId;
  if (query.targetType) where.targetType = String(query.targetType).toUpperCase();
  if (query.q) {
    const q = String(query.q).trim();
    where.OR = [{ reason: { contains: q, mode: "insensitive" } }, { details: { contains: q, mode: "insensitive" } }];
  }
  const created = parseDateRange(query);
  if (created) where.createdAt = created;
  return where;
}

async function listReports(query) {
  const { page, limit, skip } = parsePage(query);
  const where = reportWhere(query);
  const [total, items] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

async function getReport(id) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw httpError(404, "Report not found");
  const [kase, actions, notes, reporter, targetUser] = await Promise.all([
    report.caseId ? prisma.moderationCase.findUnique({ where: { id: report.caseId } }) : null,
    prisma.moderationAction.findMany({ where: { reportId: id }, orderBy: { createdAt: "desc" } }),
    prisma.moderationNote.findMany({ where: { reportId: id }, orderBy: { createdAt: "desc" } }),
    prisma.user.findUnique({ where: { id: report.reporterId } }),
    report.targetUserId ? prisma.user.findUnique({ where: { id: report.targetUserId } }) : null,
  ]);
  return {
    report,
    case: kase,
    actions,
    notes,
    reporter: publicUser(reporter),
    targetUser: staffUserSummary(targetUser),
  };
}

async function mutateReport(req, id, body) {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw httpError(404, "Report not found");
  const action = String(body.action || "").toLowerCase();
  const need = {
    assign: "reports.assign",
    claim: "reports.assign",
    unassign: "reports.assign",
    dismiss: "reports.dismiss",
    resolve: "reports.resolve",
    escalate: "reports.escalate",
  };
  if (!need[action] || !hasPermission(req.user, need[action])) {
    throw httpError(403, "You do not have permission for this report action", "FORBIDDEN");
  }
  const reason = String(body.reason || "").trim();
  let data = {};
  if (action === "assign" || action === "claim") {
    const assigneeId = action === "claim" ? req.user.id : body.assigneeId;
    if (!assigneeId) throw httpError(400, "assigneeId is required", "VALIDATION");
    if (report.assigneeId && report.assigneeId !== req.user.id && action === "claim") {
      throw httpError(409, "Report is already assigned", "CONFLICT");
    }
    data = { assigneeId, status: report.status === "NEW" ? "IN_REVIEW" : report.status };
  } else if (action === "unassign") {
    data = { assigneeId: null };
  } else if (action === "dismiss") {
    data = { status: "DISMISSED", resolution: requireReason(reason), resolvedById: req.user.id, resolvedAt: new Date() };
  } else if (action === "resolve") {
    data = { status: "RESOLVED", resolution: requireReason(reason), resolvedById: req.user.id, resolvedAt: new Date() };
  } else if (action === "escalate") {
    data = { status: "ESCALATED", assigneeId: body.assigneeId || report.assigneeId };
  } else {
    throw httpError(400, "Unknown report action", "VALIDATION");
  }
  const updated = await optimisticUpdate("report", id, report.version, data);
  if (report.caseId) {
    const kase = await prisma.moderationCase.findUnique({ where: { id: report.caseId } });
    if (kase) {
      const caseData = {};
      if (action === "claim" || action === "assign") {
        caseData.assigneeId = data.assigneeId;
        caseData.status = "IN_REVIEW";
      }
      if (action === "unassign") caseData.assigneeId = null;
      if (action === "dismiss") caseData.status = "DISMISSED";
      if (action === "resolve") caseData.status = "RESOLVED";
      if (action === "escalate") caseData.status = "ESCALATED";
      if (Object.keys(caseData).length) {
        await optimisticUpdate("moderationCase", kase.id, kase.version, caseData);
      }
    }
  }
  await writeAudit({
    req,
    action: `REPORT_${action.toUpperCase()}`,
    targetType: "REPORT",
    targetId: id,
    reason: reason || null,
    before: { status: report.status, assigneeId: report.assigneeId },
    after: { status: updated.status, assigneeId: updated.assigneeId },
    reportId: id,
    caseId: report.caseId,
  });
  return { report: updated };
}

async function listQueue(query) {
  const { page, limit, skip } = parsePage(query);
  const where = {};
  if (query.status) where.status = String(query.status).toUpperCase();
  if (query.severity) where.severity = String(query.severity).toUpperCase();
  if (query.priority) where.priority = String(query.priority).toUpperCase();
  if (query.category) where.category = String(query.category).toLowerCase();
  if (query.assigneeId === "me") where.assigneeId = query.actorId;
  else if (query.assigneeId === "unassigned") where.assigneeId = null;
  else if (query.assigneeId) where.assigneeId = query.assigneeId;
  if (query.source) where.source = String(query.source).toUpperCase();
  const created = parseDateRange(query);
  if (created) where.createdAt = created;
  const [total, items] = await Promise.all([
    prisma.moderationCase.count({ where }),
    prisma.moderationCase.findMany({ where, skip, take: limit, orderBy: [{ priority: "desc" }, { createdAt: "asc" }] }),
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

async function getCase(id) {
  const kase = await prisma.moderationCase.findUnique({ where: { id } });
  if (!kase) throw httpError(404, "Moderation case not found");
  const [report, actions, notes, targetUser] = await Promise.all([
    kase.reportId ? prisma.report.findUnique({ where: { id: kase.reportId } }) : null,
    prisma.moderationAction.findMany({ where: { caseId: id }, orderBy: { createdAt: "desc" } }),
    prisma.moderationNote.findMany({ where: { caseId: id }, orderBy: { createdAt: "desc" } }),
    kase.targetUserId ? prisma.user.findUnique({ where: { id: kase.targetUserId } }) : null,
  ]);
  return { case: kase, report, actions, notes, targetUser: staffUserSummary(targetUser) };
}

async function mutateCase(req, id, body) {
  const kase = await prisma.moderationCase.findUnique({ where: { id } });
  if (!kase) throw httpError(404, "Moderation case not found");
  const action = String(body.action || "").toLowerCase();
  let data = {};
  if (action === "claim") {
    if (kase.assigneeId && kase.assigneeId !== req.user.id && ["IN_REVIEW"].includes(kase.status)) {
      throw httpError(409, "Case is already being reviewed", "CONFLICT");
    }
    data = { assigneeId: req.user.id, status: "IN_REVIEW" };
  } else if (action === "assign") {
    if (!body.assigneeId) throw httpError(400, "assigneeId is required", "VALIDATION");
    data = { assigneeId: body.assigneeId, status: "IN_REVIEW" };
  } else if (action === "unassign") {
    data = { assigneeId: null, status: kase.status === "IN_REVIEW" ? "NEW" : kase.status };
  } else if (action === "escalate") {
    data = { status: "ESCALATED" };
  } else if (action === "resolve") {
    data = { status: "RESOLVED" };
  } else if (action === "dismiss") {
    data = { status: "DISMISSED" };
  } else if (action === "needs_info") {
    data = { status: "NEEDS_INFO" };
  } else if (action === "note") {
    const bodyText = requireReason(body.body || body.reason);
    const note = await prisma.moderationNote.create({
      data: {
        caseId: id,
        reportId: kase.reportId,
        userId: kase.targetUserId,
        authorId: req.user.id,
        body: bodyText,
        visibility: body.visibility === "WORKFLOW" ? "WORKFLOW" : "INTERNAL",
      },
    });
    return { note };
  } else {
    throw httpError(400, "Unknown case action", "VALIDATION");
  }
  if (!QUEUE_STATUSES.includes(data.status || kase.status)) {
    throw httpError(400, "Invalid status", "VALIDATION");
  }
  const updated = await optimisticUpdate("moderationCase", id, kase.version, data);
  await writeAudit({
    req,
    action: `CASE_${action.toUpperCase()}`,
    targetType: "MODERATION_CASE",
    targetId: id,
    reason: body.reason || null,
    before: { status: kase.status, assigneeId: kase.assigneeId },
    after: { status: updated.status, assigneeId: updated.assigneeId },
    caseId: id,
    reportId: kase.reportId,
  });
  return { case: updated };
}

async function hideContent(req, { type, id, reason, restore = false, caseId, reportId }) {
  if (restore) {
    if (!hasPermission(req.user, type === "COMMENT" ? "comments.restore" : "content.restore")) {
      throw httpError(403, "You do not have permission to restore this content", "FORBIDDEN");
    }
  } else if (
    !hasPermission(req.user, type === "COMMENT" ? "comments.remove" : "content.remove") &&
    !hasPermission(req.user, type === "COMMENT" ? "comments.hide" : "content.hide")
  ) {
    throw httpError(403, "You do not have permission to moderate this content", "FORBIDDEN");
  }
  const text = requireReason(reason);
  let previous;
  let resulting;
  let targetUserId = null;
  if (type === "POST") {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw httpError(404, "Post not found");
    previous = { postDisabled: post.postDisabled, postDisabledReason: post.postDisabledReason };
    const updated = await prisma.post.update({
      where: { id },
      data: restore
        ? { postDisabled: false, postDisabledReason: null, postDisabledAt: null, postDisabledById: null }
        : { postDisabled: true, postDisabledReason: text, postDisabledAt: new Date(), postDisabledById: req.user.id },
    });
    resulting = { postDisabled: updated.postDisabled, postDisabledReason: updated.postDisabledReason };
    targetUserId = post.userId;
  } else if (type === "REEL") {
    const reel = await prisma.reels.findUnique({ where: { id } });
    if (!reel) throw httpError(404, "Reel not found");
    previous = { hidden: reel.hidden };
    await prisma.reels.update({
      where: { id },
      data: restore
        ? { hidden: false, hiddenReason: null, hiddenAt: null, hiddenById: null }
        : { hidden: true, hiddenReason: text, hiddenAt: new Date(), hiddenById: req.user.id },
    });
    resulting = { hidden: !restore };
    targetUserId = reel.userId;
  } else if (type === "STORY") {
    const story = await prisma.stories.findUnique({ where: { id } });
    if (!story) throw httpError(404, "Story not found");
    previous = { hidden: story.hidden };
    await prisma.stories.update({
      where: { id },
      data: restore
        ? { hidden: false, hiddenReason: null, hiddenAt: null, hiddenById: null }
        : { hidden: true, hiddenReason: text, hiddenAt: new Date(), hiddenById: req.user.id },
    });
    resulting = { hidden: !restore };
    targetUserId = story.userId;
  } else if (type === "COMMENT") {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) throw httpError(404, "Comment not found");
    previous = { hidden: comment.hidden };
    await prisma.comment.update({
      where: { id },
      data: restore
        ? { hidden: false, hiddenReason: null, hiddenAt: null, hiddenById: null }
        : { hidden: true, hiddenReason: text, hiddenAt: new Date(), hiddenById: req.user.id },
    });
    resulting = { hidden: !restore };
    targetUserId = comment.userId;
  } else {
    throw httpError(400, "Unsupported content type", "VALIDATION");
  }
  const recorded = await recordAction(req, {
    type: restore ? `${type}_RESTORE` : `${type}_REMOVE`,
    targetType: type,
    targetId: id,
    targetUserId,
    reason: text,
    caseId,
    reportId,
    previousState: previous,
    resultingState: resulting,
    auditAction: restore ? "CONTENT_RESTORE" : "CONTENT_REMOVE",
  });
  if (targetUserId && !restore) {
    await notifyTarget(targetUserId, `Your ${type.toLowerCase()} was removed. Reason: ${text}`);
  }
  if (caseId) {
    const kase = await prisma.moderationCase.findUnique({ where: { id: caseId } });
    if (kase) await optimisticUpdate("moderationCase", caseId, kase.version, { status: "ACTION_TAKEN" }).catch(() => {});
  }
  return { action: recorded };
}

async function listContent(query) {
  const { page, limit, skip } = parsePage(query);
  const type = String(query.type || "POST").toUpperCase();
  const created = parseDateRange(query);
  if (type === "POST") {
    const where = {};
    if (query.disabled === "true") where.postDisabled = true;
    if (query.disabled === "false") where.postDisabled = false;
    if (query.userId) where.userId = query.userId;
    if (query.q) where.caption = { contains: String(query.q), mode: "insensitive" };
    if (created) where.createdAt = created;
    const [total, items] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { media: true, user: { select: { id: true, userName: true, name: true, profilePic: true } } },
      }),
    ]);
    return { type, items, page, limit, total, pages: Math.ceil(total / limit) };
  }
  if (type === "REEL") {
    const where = {};
    if (query.disabled === "true") where.hidden = true;
    if (query.disabled === "false") where.hidden = false;
    if (query.userId) where.userId = query.userId;
    if (query.q) where.caption = { contains: String(query.q), mode: "insensitive" };
    if (created) where.createdAt = created;
    const [total, items] = await Promise.all([
      prisma.reels.count({ where }),
      prisma.reels.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { media: true, user: { select: { id: true, userName: true, name: true, profilePic: true } } },
      }),
    ]);
    return { type, items, page, limit, total, pages: Math.ceil(total / limit) };
  }
  if (type === "STORY") {
    const where = {};
    if (query.disabled === "true") where.hidden = true;
    if (query.userId) where.userId = query.userId;
    if (created) where.createdAt = created;
    const [total, items] = await Promise.all([
      prisma.stories.count({ where }),
      prisma.stories.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { media: true, user: { select: { id: true, userName: true, name: true, profilePic: true } } },
      }),
    ]);
    return { type, items, page, limit, total, pages: Math.ceil(total / limit) };
  }
  throw httpError(400, "Unsupported content type", "VALIDATION");
}

async function listComments(query) {
  const { page, limit, skip } = parsePage(query);
  const where = {};
  if (query.hidden === "true") where.hidden = true;
  if (query.hidden === "false") where.hidden = false;
  if (query.userId) where.userId = query.userId;
  if (query.postId) where.postId = query.postId;
  if (query.q) where.text = { contains: String(query.q), mode: "insensitive" };
  const created = parseDateRange(query);
  if (created) where.createdAt = created;
  const [total, items] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, userName: true, name: true, profilePic: true } } },
    }),
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

async function lockDiscussion(req, postId, reason, locked = true) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw httpError(404, "Post not found");
  const updated = await prisma.post.update({
    where: { id: postId },
    data: { commentsLocked: locked },
  });
  await recordAction(req, {
    type: locked ? "DISCUSSION_LOCK" : "DISCUSSION_UNLOCK",
    targetType: "POST",
    targetId: postId,
    targetUserId: post.userId,
    reason: requireReason(reason),
    previousState: { commentsLocked: post.commentsLocked },
    resultingState: { commentsLocked: updated.commentsLocked },
    auditAction: locked ? "DISCUSSION_LOCK" : "DISCUSSION_UNLOCK",
  });
  return { post: updated };
}

async function listLivestreams(query) {
  const { page, limit, skip } = parsePage(query);
  const where = {};
  if (query.status) {
    const statuses = String(query.status).toUpperCase().split(",");
    where.status = { in: statuses };
  }
  if (query.userId) where.userId = query.userId;
  if (query.q) where.title = { contains: String(query.q), mode: "insensitive" };
  const created = parseDateRange(query);
  if (created) where.createdAt = created;
  const [total, items] = await Promise.all([
    prisma.liveStream.count({ where }),
    prisma.liveStream.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, userName: true, name: true, profilePic: true, livePrivilegesRevoked: true } } },
    }),
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

async function getLivestream(id) {
  const stream = await prisma.liveStream.findUnique({
    where: { id },
    include: { user: true, comments: { take: 50, orderBy: { createdAt: "desc" } } },
  });
  if (!stream) throw httpError(404, "Livestream not found");
  let java = null;
  let viewers = [];
  const javaId = stream.javaStreamId || stream.id;
  try {
    java = await live.getStream(javaId);
  } catch (error) {
    java = { error: live.unwrapAxios(error).message };
  }
  try {
    viewers = await live.getViewers(javaId);
  } catch {
    viewers = [];
  }
  const reports = await prisma.report.findMany({
    where: { targetType: "LIVESTREAM", targetId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const actions = await prisma.moderationAction.findMany({
    where: { targetType: "LIVESTREAM", targetId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return {
    stream: { ...stream, user: staffUserSummary(stream.user) },
    java,
    viewers,
    reports,
    actions,
  };
}

async function stopLivestream(req, id, reason) {
  const text = requireReason(reason);
  const stream = await prisma.liveStream.findUnique({ where: { id } });
  if (!stream) throw httpError(404, "Livestream not found");
  const javaId = stream.javaStreamId || stream.id;
  let javaResult;
  try {
    javaResult = await live.forceEndStream(javaId, req.user.id, `platform_moderation:${text}`);
  } catch (error) {
    const wrapped = live.unwrapAxios(error);
    throw httpError(wrapped.status || 503, wrapped.message || "Livestream service failed to terminate the stream", "LIVE_TERMINATE_FAILED");
  }
  const updated = await prisma.liveStream.update({
    where: { id },
    data: {
      status: "ENDED",
      endedAt: new Date(),
      terminatedById: req.user.id,
      terminateReason: text,
    },
  });
  await recordAction(req, {
    type: "LIVESTREAM_STOP",
    targetType: "LIVESTREAM",
    targetId: id,
    targetUserId: stream.userId,
    reason: text,
    previousState: { status: stream.status },
    resultingState: { status: updated.status, java: javaResult },
    auditAction: "LIVESTREAM_TERMINATE",
  });
  await notifyTarget(stream.userId, `Your livestream was ended by moderation. Reason: ${text}`);
  return { stream: updated, java: javaResult };
}

async function restrictLivestreamHost(req, userId, reason, revoked = true) {
  const text = requireReason(reason);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw httpError(404, "User not found");
  assertCanActOnUser(req.user, user);
  const restrictions = { ...(user.featureRestrictions || {}), livestream: revoked };
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { livePrivilegesRevoked: revoked, featureRestrictions: restrictions },
  });
  if (revoked) {
    const actives = await prisma.liveStream.findMany({
      where: { userId, status: { in: ["CREATED", "STARTING", "LIVE"] } },
    });
    for (const stream of actives) {
      try {
        await stopLivestream(req, stream.id, text);
      } catch (error) {
        console.error("[admin] failed to stop live while restricting host", stream.id, error.message);
      }
    }
  }
  await recordAction(req, {
    type: revoked ? "LIVESTREAM_RESTRICT" : "LIVESTREAM_UNRESTRICT",
    targetType: "USER",
    targetId: userId,
    targetUserId: userId,
    reason: text,
    previousState: { livePrivilegesRevoked: user.livePrivilegesRevoked },
    resultingState: { livePrivilegesRevoked: updated.livePrivilegesRevoked },
    auditAction: revoked ? "LIVESTREAM_RESTRICT" : "LIVESTREAM_UNRESTRICT",
  });
  await notifyTarget(
    userId,
    revoked ? `Your livestream privileges were suspended. Reason: ${text}` : "Your livestream privileges were restored."
  );
  return { user: staffUserSummary(updated) };
}

async function createAppeal(req, body) {
  const type = String(body.type || "").toUpperCase();
  const allowed = ["CONTENT_REMOVAL", "SUSPENSION", "BAN", "LIVESTREAM_RESTRICTION"];
  if (!allowed.includes(type)) throw httpError(400, "Unsupported appeal type", "VALIDATION");
  const statement = requireReason(body.statement);
  const actionId = body.actionId || null;
  let originalActorId = null;
  if (actionId) {
    const action = await prisma.moderationAction.findUnique({ where: { id: actionId } });
    if (action) originalActorId = action.actorId;
  }
  const appeal = await prisma.appeal.create({
    data: {
      userId: req.user.id,
      actionId,
      type,
      status: "NEW",
      statement,
      evidence: body.evidence ?? undefined,
      originalActorId,
    },
  });
  return { appeal };
}

async function listAppeals(query) {
  const { page, limit, skip } = parsePage(query);
  const where = {};
  if (query.status) where.status = String(query.status).toUpperCase();
  if (query.type) where.type = String(query.type).toUpperCase();
  if (query.userId) where.userId = query.userId;
  const created = parseDateRange(query);
  if (created) where.createdAt = created;
  const [total, items] = await Promise.all([
    prisma.appeal.count({ where }),
    prisma.appeal.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

async function reviewAppeal(req, id, body) {
  const appeal = await prisma.appeal.findUnique({ where: { id } });
  if (!appeal) throw httpError(404, "Appeal not found");
  const decision = String(body.decision || "").toUpperCase();
  if (!["UPHELD", "OVERTURNED", "PARTIAL", "REOPEN"].includes(decision)) {
    throw httpError(400, "Invalid decision", "VALIDATION");
  }
  if (appeal.originalActorId && appeal.originalActorId === req.user.id && ["OVERTURNED", "PARTIAL"].includes(decision) && !hasPermission(req.user, "moderation.override")) {
    throw httpError(403, "Another staff member must review your original decision", "SEPARATION_OF_DUTIES");
  }
  const reason = requireReason(body.reason);
  if (decision === "REOPEN") {
    const updated = await prisma.appeal.update({
      where: { id },
      data: { status: "IN_REVIEW", reviewReason: reason, reviewerId: req.user.id },
    });
    await writeAudit({ req, action: "APPEAL_REOPEN", targetType: "APPEAL", targetId: id, reason });
    return { appeal: updated };
  }
  const updated = await prisma.appeal.update({
    where: { id },
    data: {
      status: decision === "PARTIAL" ? "PARTIAL" : decision,
      reviewReason: reason,
      reviewerId: req.user.id,
      resolvedAt: new Date(),
    },
  });
  if (decision === "OVERTURNED" || decision === "PARTIAL") {
    if (appeal.type === "BAN" || appeal.type === "SUSPENSION") {
      await prisma.user.update({
        where: { id: appeal.userId },
        data: { accountStatus: "ACTIVE", profileVisibility: "PRIVATE", suspendedUntil: null },
      });
    }
    if (appeal.type === "LIVESTREAM_RESTRICTION") {
      const u = await prisma.user.findUnique({ where: { id: appeal.userId } });
      const restrictions = { ...(u?.featureRestrictions || {}), livestream: false };
      await prisma.user.update({
        where: { id: appeal.userId },
        data: { livePrivilegesRevoked: false, featureRestrictions: restrictions },
      });
    }
    if (appeal.type === "CONTENT_REMOVAL" && appeal.actionId) {
      const action = await prisma.moderationAction.findUnique({ where: { id: appeal.actionId } });
      if (action?.targetType && action.targetId) {
        await hideContent(req, {
          type: action.targetType,
          id: action.targetId,
          reason: `Appeal overturned: ${reason}`,
          restore: true,
        }).catch(() => {});
      }
    }
    await notifyTarget(appeal.userId, `Your appeal was ${decision.toLowerCase()}. ${reason}`);
  } else {
    await notifyTarget(appeal.userId, `Your appeal was upheld. ${reason}`);
  }
  await writeAudit({
    req,
    action: `APPEAL_${decision}`,
    targetType: "APPEAL",
    targetId: id,
    reason,
    before: { status: appeal.status },
    after: { status: updated.status },
  });
  return { appeal: updated };
}

async function listStaff(query) {
  const { page, limit, skip } = parsePage(query);
  const where = { roleKey: { not: "USER" } };
  if (query.roleKey) where.roleKey = String(query.roleKey).toUpperCase();
  if (query.q) {
    const q = String(query.q).trim();
    where.OR = [
      { userName: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        userName: true,
        name: true,
        email: true,
        profilePic: true,
        roleKey: true,
        accountStatus: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

async function listRoles() {
  const roles = await prisma.role.findMany({ orderBy: { rank: "desc" } });
  const withCounts = [];
  for (const role of roles) {
    const staffCount = await prisma.user.count({ where: { roleKey: role.key } });
    withCounts.push({ ...role, staffCount });
  }
  return withCounts;
}

async function mutateRole(req, body, id) {
  const data = pickAllowedBody(body, ["key", "name", "description", "permissions", "rank"]);
  if (Array.isArray(data.permissions)) {
    data.permissions = data.permissions.filter(isKnownPermission);
  }
  if (id) {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) throw httpError(404, "Role not found");
    if (existing.isSystem && (body.archive || data.key)) {
      throw httpError(400, "System roles cannot be renamed or archived", "VALIDATION");
    }
    if (body.archive) {
      if (existing.isSystem) throw httpError(400, "Cannot archive a system role", "VALIDATION");
      const used = await prisma.user.count({ where: { roleKey: existing.key } });
      if (used) throw httpError(400, "Reassign staff before archiving this role", "VALIDATION");
      const updated = await prisma.role.update({ where: { id }, data: { archived: true } });
      await writeAudit({ req, action: "ROLE_ARCHIVE", targetType: "ROLE", targetId: id, after: updated });
      return { role: updated };
    }
    if (data.rank != null && Number(data.rank) >= rankOf(req.user) && roleKeyOf(req.user) !== "SUPER_ADMIN") {
      throw httpError(403, "Cannot set a role rank at or above your own", "PRIVILEGE_ESCALATION");
    }
    const updated = await prisma.role.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        description: data.description ?? existing.description,
        permissions: data.permissions ?? existing.permissions,
        rank: data.rank ?? existing.rank,
      },
    });
    await writeAudit({
      req,
      action: "ROLE_EDIT",
      targetType: "ROLE",
      targetId: id,
      before: existing,
      after: updated,
      reason: body.reason,
    });
    return { role: updated };
  }
  const key = String(data.key || "").toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  if (!key || key.length < 3) throw httpError(400, "A valid role key is required", "VALIDATION");
  if (["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT", "ANALYST", "USER"].includes(key) && !body.allowSystem) {
    throw httpError(400, "That role key is reserved", "VALIDATION");
  }
  const rank = Number(data.rank || 10);
  if (rank >= rankOf(req.user) && roleKeyOf(req.user) !== "SUPER_ADMIN") {
    throw httpError(403, "Cannot create a role at or above your rank", "PRIVILEGE_ESCALATION");
  }
  const created = await prisma.role.create({
    data: {
      key,
      name: data.name || key,
      description: data.description || "",
      permissions: data.permissions || [],
      rank,
      isSystem: false,
    },
  });
  await writeAudit({ req, action: "ROLE_CREATE", targetType: "ROLE", targetId: created.id, after: created });
  return { role: created };
}

async function duplicateRole(req, id) {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) throw httpError(404, "Role not found");
  return mutateRole(req, {
    key: `${existing.key}_COPY`,
    name: `${existing.name} copy`,
    description: existing.description,
    permissions: existing.permissions,
    rank: Math.min(existing.rank, rankOf(req.user) - 1),
  });
}

async function listAudit(query) {
  const { page, limit, skip } = parsePage(query);
  const where = {};
  if (query.action) where.action = String(query.action);
  if (query.actorId) where.actorId = query.actorId;
  if (query.targetType) where.targetType = query.targetType;
  if (query.targetId) where.targetId = query.targetId;
  if (query.q) {
    const q = String(query.q).trim();
    where.OR = [{ action: { contains: q, mode: "insensitive" } }, { reason: { contains: q, mode: "insensitive" } }];
  }
  const created = parseDateRange(query);
  if (created) where.createdAt = created;
  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
  ]);
  return { items, page, limit, total, pages: Math.ceil(total / limit) };
}

async function startImpersonation(req, targetId, reason) {
  const text = requireReason(reason);
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw httpError(404, "User not found");
  if (!hasPermission(req.user, "users.impersonate")) throw httpError(403, "Missing permission", "FORBIDDEN");
  if (isStaff({ roleKey: target.roleKey }) && rankOf(req.user) <= rankOf(target)) {
    throw httpError(403, "Cannot impersonate equal or higher-privileged staff", "PRIVILEGE_ESCALATION");
  }
  if (String(req.user.id) === String(targetId)) {
    throw httpError(400, "You cannot impersonate yourself", "VALIDATION");
  }
  if (req.impersonating) throw httpError(400, "Already impersonating", "VALIDATION");
  const session = await prisma.impersonationSession.create({
    data: { actorId: req.user.id, targetId, active: true },
  });
  const jwtResponse = await signJWT(target.email, target.name, target.userName, {
    sid: target.sessionVersion || 0,
    impersonatorId: req.user.id,
    impersonationId: session.id,
  });
  await writeAudit({
    req,
    action: "IMPERSONATION_START",
    targetType: "USER",
    targetId,
    reason: text,
    after: { impersonationId: session.id },
  });
  return {
    token: jwtResponse.data,
    userName: target.userName,
    impersonationId: session.id,
    target: staffUserSummary(target),
  };
}

async function stopImpersonation(req) {
  const impersonator = req.impersonator;
  const sessionId = req.impersonationId;
  if (!impersonator || !sessionId) throw httpError(400, "Not impersonating", "VALIDATION");
  await prisma.impersonationSession.update({
    where: { id: sessionId },
    data: { active: false, endedAt: new Date() },
  });
  const jwtResponse = await signJWT(impersonator.email, impersonator.name, impersonator.userName, {
    sid: impersonator.sessionVersion || 0,
  });
  await writeAudit({
    req,
    actor: impersonator,
    action: "IMPERSONATION_END",
    targetType: "USER",
    targetId: req.user.id,
  });
  return { token: jwtResponse.data, userName: impersonator.userName, target: staffUserSummary(impersonator) };
}

async function sendAnnouncement(req, body) {
  const title = String(body.title || "").trim();
  const message = String(body.body || body.message || "").trim();
  if (!title || !message) throw httpError(400, "title and body are required", "VALIDATION");
  const audience = String(body.audience || "ALL").toUpperCase();
  let userIds = [];
  if (audience === "USER_IDS") {
    userIds = Array.isArray(body.targetUserIds) ? body.targetUserIds.filter(isObjectId) : [];
  } else if (audience === "STAFF") {
    const staff = await prisma.user.findMany({ where: { roleKey: { not: "USER" } }, select: { id: true } });
    userIds = staff.map((u) => u.id);
  } else {
    const users = await prisma.user.findMany({
      where: { accountStatus: "ACTIVE", deletedAt: null },
      select: { id: true },
      take: 5000,
    });
    userIds = users.map((u) => u.id);
  }
  const row = await prisma.adminAnnouncement.create({
    data: {
      title,
      body: message,
      audience,
      targetUserIds: userIds,
      createdById: req.user.id,
      status: "SENT",
      sentAt: new Date(),
    },
  });
  await Promise.all(userIds.map((id) => notifyUser(id, { message: `${title}: ${message}`, type: "system" })));
  await writeAudit({
    req,
    action: "NOTIFICATION_BROADCAST",
    targetType: "ANNOUNCEMENT",
    targetId: row.id,
    reason: title,
    after: { audience, count: userIds.length },
  });
  return { announcement: row, delivered: userIds.length };
}

async function updateFlag(req, key, enabled, reason) {
  const text = requireReason(reason);
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  if (!flag) throw httpError(404, "Unknown feature flag");
  const updated = await prisma.featureFlag.update({
    where: { key },
    data: { enabled: Boolean(enabled), updatedById: req.user.id },
  });
  invalidateFlags();
  await writeAudit({
    req,
    action: "FEATURE_FLAG_UPDATE",
    targetType: "FEATURE_FLAG",
    targetId: key,
    reason: text,
    before: { enabled: flag.enabled },
    after: { enabled: updated.enabled },
  });
  return { flag: updated };
}

async function updateSetting(req, key, value, reason) {
  const text = requireReason(reason);
  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  const updated = await prisma.systemSetting.upsert({
    where: { key },
    update: { value, updatedById: req.user.id },
    create: { key, value, updatedById: req.user.id },
  });
  await writeAudit({
    req,
    action: "SETTINGS_UPDATE",
    targetType: "SETTING",
    targetId: key,
    reason: text,
    before: existing?.value,
    after: value,
  });
  return { setting: updated };
}

async function systemHealth() {
  const health = {
    api: { ok: true, detail: "Express process responding" },
    database: { ok: false, detail: null },
    livestream: { ok: false, detail: null },
  };
  try {
    const started = Date.now();
    await prisma.user.count();
    health.database = { ok: true, detail: `Prisma query ok (${Date.now() - started}ms)` };
  } catch (error) {
    health.database = { ok: false, detail: error.message };
  }
  try {
    const axios = require("axios");
    const base = (process.env.LIVESTREAM_SERVICE_URL || "http://localhost:8085").replace(/\/$/, "");
    const started = Date.now();
    const res = await axios.get(`${base}/health`, { timeout: 3000 });
    health.livestream = { ok: res.status === 200, detail: `Java /health ${res.status} (${Date.now() - started}ms)` };
  } catch (error) {
    health.livestream = { ok: false, detail: error.message || "Livestream service unreachable" };
  }
  return { health, measuredAt: new Date().toISOString() };
}

async function analytics(query) {
  const created = parseDateRange(query) || { gte: new Date(Date.now() - 30 * 86400000) };
  const [users, posts, reports, actions, lives] = await Promise.all([
    prisma.user.count({ where: { createdAt: created } }),
    prisma.post.count({ where: { createdAt: created } }),
    prisma.report.count({ where: { createdAt: created } }),
    prisma.moderationAction.count({ where: { createdAt: created } }),
    prisma.liveStream.count({ where: { createdAt: created } }),
  ]);
  return {
    range: created,
    newUsers: users,
    newPosts: posts,
    reports,
    moderationActions: actions,
    livestreams: lives,
  };
}

async function bulk(req, body) {
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter(Boolean))] : [];
  if (!ids.length) throw httpError(400, "ids are required", "VALIDATION");
  if (ids.length > 50) throw httpError(400, "Bulk actions are limited to 50 items", "VALIDATION");
  const action = String(body.action || "").toLowerCase();
  const type = String(body.type || "REPORT").toUpperCase();
  const reason = body.reason;
  const results = { succeeded: [], failed: [] };
  for (const id of ids) {
    try {
      if (type === "REPORT") {
        await mutateReport(req, id, { action, reason, assigneeId: body.assigneeId });
      } else if (type === "POST" && (action === "hide" || action === "remove" || action === "restore")) {
        await hideContent(req, { type: "POST", id, reason, restore: action === "restore" });
      } else if (type === "COMMENT" && (action === "hide" || action === "remove" || action === "restore")) {
        await hideContent(req, { type: "COMMENT", id, reason, restore: action === "restore" });
      } else if (type === "USER" && action === "warn") {
        await applyUserAction(req, id, { action: "warn", reason });
      } else {
        throw httpError(400, "Unsupported bulk action", "VALIDATION");
      }
      results.succeeded.push(id);
    } catch (error) {
      results.failed.push({ id, message: error.message, code: error.code });
    }
  }
  await writeAudit({
    req,
    action: "BULK_ACTION",
    targetType: type,
    targetId: ids.join(","),
    reason,
    after: { action, succeeded: results.succeeded.length, failed: results.failed.length },
  });
  return results;
}

async function reportCategories() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "report_categories" } });
  const value = setting?.value;
  if (Array.isArray(value) && value.length) return value;
  return DEFAULT_REPORT_CATEGORIES;
}

module.exports = {
  dashboard,
  listUsers,
  getUser,
  applyUserAction,
  changeUserRole,
  changeUserPermissions,
  createReport,
  listReports,
  getReport,
  mutateReport,
  listQueue,
  getCase,
  mutateCase,
  hideContent,
  listContent,
  listComments,
  lockDiscussion,
  listLivestreams,
  getLivestream,
  stopLivestream,
  restrictLivestreamHost,
  createAppeal,
  listAppeals,
  reviewAppeal,
  listStaff,
  listRoles,
  mutateRole,
  duplicateRole,
  listAudit,
  startImpersonation,
  stopImpersonation,
  sendAnnouncement,
  updateFlag,
  updateSetting,
  systemHealth,
  analytics,
  bulk,
  reportCategories,
  httpError,
};
