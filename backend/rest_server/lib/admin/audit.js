const prisma = require("../prisma");
const { roleKeyOf } = require("./authorize");
const { clientMeta } = require("./respond");

async function writeAudit({
  req,
  actor,
  action,
  targetType,
  targetId,
  reason,
  before,
  after,
  caseId,
  reportId,
}) {
  try {
    const meta = req ? clientMeta(req) : {};
    const actorUser = actor || req?.user;
    await prisma.auditLog.create({
      data: {
        actorId: actorUser?.id || null,
        actorRole: actorUser ? roleKeyOf(actorUser) : null,
        action: String(action),
        targetType: targetType ? String(targetType) : null,
        targetId: targetId ? String(targetId) : null,
        reason: reason ? String(reason).slice(0, 2000) : null,
        requestId: meta.requestId,
        ip: meta.ip,
        userAgent: meta.userAgent ? String(meta.userAgent).slice(0, 500) : null,
        before: before ?? undefined,
        after: after ?? undefined,
        caseId: caseId || null,
        reportId: reportId || null,
        impersonationId: req?.impersonationId || null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write", action, error.message || error);
  }
}

function logPrivileged(event, extra = {}) {
  const safe = { event, ...extra };
  delete safe.password;
  delete safe.token;
  delete safe.authorization;
  console.info("[admin]", JSON.stringify(safe));
}

module.exports = { writeAudit, logPrivileged };
