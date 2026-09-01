const svc = require("../../lib/admin/service");
const { ok, fromError, fail } = require("../../lib/admin/respond");
const { staffCapabilities, isStaff } = require("../../lib/admin/authorize");
const { sanitizeUser } = require("../../lib/admin/sanitize");
const { PERMISSIONS, permissionGroups, DEFAULT_REPORT_CATEGORIES } = require("../../lib/admin/permissions");
const { loadFlags, DEFAULT_FLAGS } = require("../../lib/admin/flags");
const prisma = require("../../lib/prisma");

function wrap(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req, res);
      if (data === undefined) return;
      return ok(res, data);
    } catch (error) {
      return fromError(res, error);
    }
  };
}

exports.me = wrap(async (req) => {
  const role = await prisma.role.findUnique({ where: { key: req.user.roleKey || "USER" } }).catch(() => null);
  return {
    user: sanitizeUser(req.user, { includeStaff: true }),
    capabilities: staffCapabilities(req.user, role),
    impersonating: Boolean(req.impersonating),
    impersonator: req.impersonator
      ? { id: req.impersonator.id, userName: req.impersonator.userName, name: req.impersonator.name, roleKey: req.impersonator.roleKey }
      : null,
  };
});

exports.meta = wrap(async () => ({
  permissions: PERMISSIONS,
  groups: permissionGroups(),
  flags: DEFAULT_FLAGS,
  reportCategories: await svc.reportCategories().catch(() => DEFAULT_REPORT_CATEGORIES),
}));

exports.dashboard = wrap(async (req) => svc.dashboard(req.query));
exports.analytics = wrap(async (req) => svc.analytics(req.query));
exports.system = wrap(async () => svc.systemHealth());

exports.listUsers = wrap(async (req) => svc.listUsers(req.query));
exports.getUser = wrap(async (req) => svc.getUser(req.params.id));
exports.userAction = wrap(async (req) => svc.applyUserAction(req, req.params.id, req.body || {}));
exports.userRole = wrap(async (req) => svc.changeUserRole(req, req.params.id, req.body || {}));
exports.userPermissions = wrap(async (req) => svc.changeUserPermissions(req, req.params.id, req.body || {}));

exports.listReports = wrap(async (req) => svc.listReports(req.query));
exports.getReport = wrap(async (req) => svc.getReport(req.params.id));
exports.reportAction = wrap(async (req) => svc.mutateReport(req, req.params.id, req.body || {}));

exports.listQueue = wrap(async (req) => svc.listQueue({ ...req.query, actorId: req.user.id }));
exports.getCase = wrap(async (req) => svc.getCase(req.params.id));
exports.caseAction = wrap(async (req) => svc.mutateCase(req, req.params.id, req.body || {}));

exports.listContent = wrap(async (req) => svc.listContent(req.query));
exports.contentAction = wrap(async (req) => {
  const type = String(req.body?.type || req.params.type || "POST").toUpperCase();
  const restore = String(req.body?.action || "").toLowerCase() === "restore";
  return svc.hideContent(req, {
    type,
    id: req.params.id,
    reason: req.body?.reason,
    restore,
    caseId: req.body?.caseId,
    reportId: req.body?.reportId,
  });
});

exports.listComments = wrap(async (req) => svc.listComments(req.query));
exports.commentAction = wrap(async (req) => {
  const restore = String(req.body?.action || "").toLowerCase() === "restore";
  return svc.hideContent(req, {
    type: "COMMENT",
    id: req.params.id,
    reason: req.body?.reason,
    restore,
    caseId: req.body?.caseId,
    reportId: req.body?.reportId,
  });
});
exports.lockComments = wrap(async (req) =>
  svc.lockDiscussion(req, req.params.postId, req.body?.reason, req.body?.locked !== false)
);

exports.listLivestreams = wrap(async (req) => svc.listLivestreams(req.query));
exports.getLivestream = wrap(async (req) => svc.getLivestream(req.params.id));
exports.stopLivestream = wrap(async (req) => svc.stopLivestream(req, req.params.id, req.body?.reason));
exports.restrictLive = wrap(async (req) =>
  svc.restrictLivestreamHost(req, req.params.userId, req.body?.reason, req.body?.revoked !== false)
);

exports.listAppeals = wrap(async (req) => svc.listAppeals(req.query));
exports.reviewAppeal = wrap(async (req) => svc.reviewAppeal(req, req.params.id, req.body || {}));

exports.listStaff = wrap(async (req) => svc.listStaff(req.query));
exports.listRoles = wrap(async () => svc.listRoles());
exports.createRole = wrap(async (req) => svc.mutateRole(req, req.body || {}));
exports.updateRole = wrap(async (req) => svc.mutateRole(req, req.body || {}, req.params.id));
exports.duplicateRole = wrap(async (req) => svc.duplicateRole(req, req.params.id));

exports.listAudit = wrap(async (req) => svc.listAudit(req.query));
exports.exportAudit = wrap(async (req, res) => {
  const data = await svc.listAudit({ ...req.query, limit: 100, page: req.query.page || 1 });
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=pixl-audit.json");
  return res.status(200).json(data);
});

exports.startImpersonation = wrap(async (req) => svc.startImpersonation(req, req.params.id, req.body?.reason));
exports.stopImpersonation = wrap(async (req) => svc.stopImpersonation(req));

exports.announce = wrap(async (req) => svc.sendAnnouncement(req, req.body || {}));
exports.listFlags = wrap(async () => {
  const rows = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  const current = await loadFlags(true);
  return { flags: rows, current };
});
exports.updateFlag = wrap(async (req) =>
  svc.updateFlag(req, req.params.key, req.body?.enabled, req.body?.reason)
);
exports.listSettings = wrap(async () => prisma.systemSetting.findMany());
exports.updateSetting = wrap(async (req) =>
  svc.updateSetting(req, req.params.key, req.body?.value, req.body?.reason)
);

exports.bulk = wrap(async (req) => svc.bulk(req, req.body || {}));

exports.listNotifications = wrap(async (req) => {
  const prismaClient = require("../../lib/prisma");
  const { parsePage } = require("../../lib/admin/respond");
  const { page, limit, skip } = parsePage(req.query);
  const where = {};
  if (req.query.type) where.type = req.query.type;
  const [total, items] = await Promise.all([
    prismaClient.userNotification.count({ where }),
    prismaClient.adminAnnouncement.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
  ]);
  return { announcements: items, notificationCount: total, page, limit };
});

exports.requireStaffFlag = (req, res, next) => {
  if (!isStaff(req.user)) return fail(res, 403, "Staff access required", "FORBIDDEN");
  next();
};
