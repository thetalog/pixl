const express = require("express");
const admin = require("../controller/admin/admin");
const { requirePermission, requireStaff } = require("../middlewares/requirePermission");
const { rateLimit } = require("../lib/admin/rateLimit");

const router = express.Router();
const sensitive = rateLimit({ prefix: "admin-mut", limit: 40, windowMs: 60_000 });

router.use(requireStaff);

router.get("/me", admin.me);
router.get("/meta", requirePermission("moderation.read", "users.read", "analytics.read"), admin.meta);
router.get("/dashboard", requirePermission("analytics.read", "moderation.read", "users.read"), admin.dashboard);
router.get("/analytics", requirePermission("analytics.read"), admin.analytics);
router.get("/system", requirePermission("system.read"), admin.system);

router.get("/users", requirePermission("users.read", "users.search"), admin.listUsers);
router.get("/users/:id", requirePermission("users.read"), admin.getUser);
router.post("/users/:id/actions", sensitive, requirePermission("moderation.act", "users.suspend", "users.ban", "users.unban"), admin.userAction);
router.post("/users/:id/role", sensitive, requirePermission("admins.edit", "moderators.edit", "admins.create", "moderators.create"), admin.userRole);
router.post("/users/:id/permissions", sensitive, requirePermission("admins.edit"), admin.userPermissions);
router.post("/users/:id/impersonate", sensitive, requirePermission("users.impersonate"), admin.startImpersonation);
router.post("/impersonation/stop", admin.stopImpersonation);

router.get("/reports", requirePermission("reports.read"), admin.listReports);
router.get("/reports/:id", requirePermission("reports.read"), admin.getReport);
router.post("/reports/:id/actions", sensitive, requirePermission("reports.assign", "reports.resolve", "reports.dismiss", "reports.escalate"), admin.reportAction);

router.get("/moderation", requirePermission("moderation.read"), admin.listQueue);
router.get("/moderation/:id", requirePermission("moderation.read"), admin.getCase);
router.post("/moderation/:id/actions", sensitive, requirePermission("moderation.act", "reports.assign"), admin.caseAction);

router.get("/content", requirePermission("content.read"), admin.listContent);
router.post("/content/:id/actions", sensitive, requirePermission("content.hide", "content.remove", "content.restore"), admin.contentAction);

router.get("/comments", requirePermission("comments.read"), admin.listComments);
router.post("/comments/:id/actions", sensitive, requirePermission("comments.hide", "comments.remove", "comments.restore"), admin.commentAction);
router.post("/posts/:postId/lock", sensitive, requirePermission("comments.hide", "content.hide"), admin.lockComments);

router.get("/livestreams", requirePermission("livestreams.read"), admin.listLivestreams);
router.get("/livestreams/:id", requirePermission("livestreams.read", "livestreams.review"), admin.getLivestream);
router.post("/livestreams/:id/stop", sensitive, requirePermission("livestreams.stop"), admin.stopLivestream);
router.post("/livestreams/hosts/:userId/restrict", sensitive, requirePermission("livestreams.restrict"), admin.restrictLive);

router.get("/appeals", requirePermission("moderation.appeal"), admin.listAppeals);
router.post("/appeals/:id/review", sensitive, requirePermission("moderation.appeal"), admin.reviewAppeal);

router.get("/staff", requirePermission("admins.read", "moderators.read"), admin.listStaff);
router.get("/roles", requirePermission("admins.read", "moderators.read"), admin.listRoles);
router.post("/roles", sensitive, requirePermission("admins.edit"), admin.createRole);
router.post("/roles/:id", sensitive, requirePermission("admins.edit"), admin.updateRole);
router.post("/roles/:id/duplicate", sensitive, requirePermission("admins.edit"), admin.duplicateRole);

router.get("/audit-logs", requirePermission("audit.read"), admin.listAudit);
router.get("/audit-logs/export", requirePermission("audit.export"), admin.exportAudit);

router.get("/notifications", requirePermission("notifications.read"), admin.listNotifications);
router.post("/notifications/broadcast", sensitive, requirePermission("notifications.broadcast", "notifications.send"), admin.announce);

router.get("/feature-flags", requirePermission("feature_flags.read"), admin.listFlags);
router.post("/feature-flags/:key", sensitive, requirePermission("feature_flags.update"), admin.updateFlag);

router.get("/settings", requirePermission("settings.read"), admin.listSettings);
router.post("/settings/:key", sensitive, requirePermission("settings.update"), admin.updateSetting);

router.post("/bulk", sensitive, requirePermission("moderation.act", "reports.resolve"), admin.bulk);

module.exports = router;
