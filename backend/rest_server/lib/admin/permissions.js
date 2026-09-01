/**
 * Central permission catalog and default role matrix.
 * Roles are data (Role collection); this file is the source of truth for keys,
 * labels, danger flags, and seeded system-role grants.
 */

const PERMISSIONS = [
  { key: "users.read", domain: "users", label: "View users", description: "View user profiles and account metadata" },
  { key: "users.search", domain: "users", label: "Search users", description: "Search and filter the user directory" },
  { key: "users.edit", domain: "users", label: "Edit users", description: "Edit non-privileged user profile fields" },
  { key: "users.suspend", domain: "users", label: "Suspend users", description: "Temporarily or indefinitely suspend accounts", dangerous: true },
  { key: "users.ban", domain: "users", label: "Ban users", description: "Permanently ban accounts", dangerous: true },
  { key: "users.unban", domain: "users", label: "Unban / restore access", description: "Lift bans and suspensions" },
  { key: "users.impersonate", domain: "users", label: "Impersonate users", description: "Sign in as another user", dangerous: true },
  { key: "users.delete", domain: "users", label: "Delete users", description: "Soft-delete user accounts", dangerous: true },
  { key: "users.restore", domain: "users", label: "Restore users", description: "Restore soft-deleted accounts", dangerous: true },

  { key: "content.read", domain: "content", label: "View content", description: "Inspect posts, reels, stories, and profiles" },
  { key: "content.review", domain: "content", label: "Review content", description: "Mark content as reviewed" },
  { key: "content.hide", domain: "content", label: "Hide content", description: "Hide content from public surfaces" },
  { key: "content.remove", domain: "content", label: "Remove content", description: "Remove content for policy violations", dangerous: true },
  { key: "content.restore", domain: "content", label: "Restore content", description: "Restore hidden or removed content" },
  { key: "content.feature", domain: "content", label: "Feature content", description: "Feature content in discovery" },
  { key: "content.unfeature", domain: "content", label: "Unfeature content", description: "Remove featured state" },
  { key: "content.pin", domain: "content", label: "Pin content", description: "Pin content where supported" },
  { key: "content.unpin", domain: "content", label: "Unpin content", description: "Unpin content" },

  { key: "comments.read", domain: "comments", label: "View comments", description: "Search and inspect comments" },
  { key: "comments.hide", domain: "comments", label: "Hide comments", description: "Hide comments from public threads" },
  { key: "comments.remove", domain: "comments", label: "Remove comments", description: "Remove comments", dangerous: true },
  { key: "comments.restore", domain: "comments", label: "Restore comments", description: "Restore hidden or removed comments" },

  { key: "reports.read", domain: "reports", label: "View reports", description: "View user reports" },
  { key: "reports.assign", domain: "reports", label: "Assign reports", description: "Assign or claim reports" },
  { key: "reports.resolve", domain: "reports", label: "Resolve reports", description: "Resolve reports with a reason" },
  { key: "reports.dismiss", domain: "reports", label: "Dismiss reports", description: "Dismiss reports" },
  { key: "reports.escalate", domain: "reports", label: "Escalate reports", description: "Escalate reports to higher staff" },

  { key: "livestreams.read", domain: "livestreams", label: "View livestreams", description: "Inspect live and historical streams" },
  { key: "livestreams.stop", domain: "livestreams", label: "Stop livestreams", description: "Terminate a live session via the livestream service", dangerous: true },
  { key: "livestreams.review", domain: "livestreams", label: "Review livestreams", description: "Review livestream reports and metadata" },
  { key: "livestreams.moderate", domain: "livestreams", label: "Moderate livestreams", description: "Take in-stream moderation actions" },
  { key: "livestreams.restrict", domain: "livestreams", label: "Restrict livestream privileges", description: "Suspend a host's ability to go live", dangerous: true },

  { key: "moderation.read", domain: "moderation", label: "View moderation queue", description: "View the unified moderation queue" },
  { key: "moderation.act", domain: "moderation", label: "Take moderation actions", description: "Warn, hide, restrict, and related actions" },
  { key: "moderation.appeal", domain: "moderation", label: "Handle appeals", description: "Uphold or overturn appeals" },
  { key: "moderation.override", domain: "moderation", label: "Override moderation", description: "Override another staff member's decision", dangerous: true },

  { key: "notifications.read", domain: "notifications", label: "View notifications", description: "Inspect notification history" },
  { key: "notifications.send", domain: "notifications", label: "Send notifications", description: "Send targeted in-app notifications" },
  { key: "notifications.broadcast", domain: "notifications", label: "Broadcast notifications", description: "Send platform-wide announcements", dangerous: true },

  { key: "settings.read", domain: "settings", label: "View settings", description: "View platform settings" },
  { key: "settings.update", domain: "settings", label: "Update settings", description: "Change platform settings", dangerous: true },

  { key: "admins.read", domain: "admins", label: "View admins", description: "List administrator staff" },
  { key: "admins.create", domain: "admins", label: "Create admins", description: "Grant administrator roles", dangerous: true },
  { key: "admins.edit", domain: "admins", label: "Edit admins", description: "Modify administrator assignments", dangerous: true },
  { key: "admins.remove", domain: "admins", label: "Remove admins", description: "Revoke administrator access", dangerous: true },

  { key: "moderators.read", domain: "moderators", label: "View moderators", description: "List moderator staff" },
  { key: "moderators.create", domain: "moderators", label: "Create moderators", description: "Grant moderator roles" },
  { key: "moderators.edit", domain: "moderators", label: "Edit moderators", description: "Modify moderator assignments" },
  { key: "moderators.remove", domain: "moderators", label: "Remove moderators", description: "Revoke moderator access" },

  { key: "audit.read", domain: "audit", label: "View audit logs", description: "Read immutable audit events" },
  { key: "audit.export", domain: "audit", label: "Export audit logs", description: "Export audit events", dangerous: true },

  { key: "analytics.read", domain: "analytics", label: "View analytics", description: "View operational analytics" },
  { key: "system.read", domain: "system", label: "View system health", description: "View measurable system health" },

  { key: "feature_flags.read", domain: "feature_flags", label: "View feature flags", description: "View emergency and feature controls" },
  { key: "feature_flags.update", domain: "feature_flags", label: "Update feature flags", description: "Toggle platform feature flags", dangerous: true },

  { key: "support.read", domain: "support", label: "View support", description: "View support queues and account notes" },
  { key: "support.respond", domain: "support", label: "Respond to support", description: "Add support notes and limited account help" },
];

const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);
const PERMISSION_SET = new Set(PERMISSION_KEYS);
const DANGEROUS_PERMISSIONS = new Set(PERMISSIONS.filter((p) => p.dangerous).map((p) => p.key));

const SYSTEM_ROLE_KEYS = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT", "ANALYST", "USER"];

const ROLE_RANKS = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MODERATOR: 60,
  SUPPORT: 40,
  ANALYST: 20,
  USER: 0,
};

const ROLE_META = {
  SUPER_ADMIN: {
    name: "Super admin",
    description: "Full platform authority. Cannot be archived or outranked.",
  },
  ADMIN: {
    name: "Admin",
    description: "Platform administration with controlled access to security-sensitive capabilities.",
  },
  MODERATOR: {
    name: "Moderator",
    description: "Content and user moderation. No staff, settings, or system controls.",
  },
  SUPPORT: {
    name: "Support",
    description: "Support-related account actions and limited moderation visibility.",
  },
  ANALYST: {
    name: "Analyst",
    description: "Read-only analytics and operational information.",
  },
  USER: {
    name: "User",
    description: "Normal application access. No staff console.",
  },
};

const MODERATOR_PERMISSIONS = [
  "users.read",
  "users.search",
  "users.suspend",
  "users.unban",
  "content.read",
  "content.review",
  "content.hide",
  "content.remove",
  "content.restore",
  "comments.read",
  "comments.hide",
  "comments.remove",
  "comments.restore",
  "reports.read",
  "reports.assign",
  "reports.resolve",
  "reports.dismiss",
  "reports.escalate",
  "livestreams.read",
  "livestreams.stop",
  "livestreams.review",
  "livestreams.moderate",
  "livestreams.restrict",
  "moderation.read",
  "moderation.act",
  "moderation.appeal",
  "notifications.read",
  "audit.read",
  "support.read",
];

const SUPPORT_PERMISSIONS = [
  "users.read",
  "users.search",
  "reports.read",
  "content.read",
  "comments.read",
  "moderation.read",
  "moderation.appeal",
  "notifications.read",
  "support.read",
  "support.respond",
];

const ANALYST_PERMISSIONS = [
  "users.read",
  "users.search",
  "content.read",
  "comments.read",
  "reports.read",
  "livestreams.read",
  "moderation.read",
  "notifications.read",
  "audit.read",
  "analytics.read",
  "system.read",
  "feature_flags.read",
  "settings.read",
];

const ADMIN_DENIED = [];

function unique(list) {
  return [...new Set(list)];
}

function permissionsForRoleKey(roleKey) {
  if (roleKey === "SUPER_ADMIN") return [...PERMISSION_KEYS];
  if (roleKey === "ADMIN") return PERMISSION_KEYS.filter((k) => !ADMIN_DENIED.includes(k));
  if (roleKey === "MODERATOR") return [...MODERATOR_PERMISSIONS];
  if (roleKey === "SUPPORT") return [...SUPPORT_PERMISSIONS];
  if (roleKey === "ANALYST") return [...ANALYST_PERMISSIONS];
  return [];
}

function isKnownPermission(key) {
  return PERMISSION_SET.has(String(key || ""));
}

function isDangerousPermission(key) {
  return DANGEROUS_PERMISSIONS.has(String(key || ""));
}

function permissionGroups() {
  const groups = {};
  for (const perm of PERMISSIONS) {
    if (!groups[perm.domain]) groups[perm.domain] = [];
    groups[perm.domain].push(perm);
  }
  return groups;
}

function defaultRoleSeed() {
  return SYSTEM_ROLE_KEYS.map((key) => ({
    key,
    name: ROLE_META[key].name,
    description: ROLE_META[key].description,
    permissions: permissionsForRoleKey(key),
    rank: ROLE_RANKS[key],
    isSystem: true,
    archived: false,
  }));
}

const DEFAULT_REPORT_CATEGORIES = [
  "spam",
  "harassment",
  "hate",
  "violence",
  "sexual_content",
  "self_harm",
  "impersonation",
  "copyright",
  "scam",
  "fraud",
  "misinformation",
  "other",
];

const QUEUE_STATUSES = [
  "NEW",
  "IN_REVIEW",
  "NEEDS_INFO",
  "ACTION_TAKEN",
  "ESCALATED",
  "RESOLVED",
  "DISMISSED",
];

const STRIKE_TYPES = [
  "warning",
  "strike",
  "temporary_restriction",
  "temporary_suspension",
  "permanent_ban",
];

const HIGH_RISK_IMPERSONATION_BLOCKLIST = [
  "users.impersonate",
  "users.delete",
  "users.ban",
  "users.restore",
  "admins.create",
  "admins.edit",
  "admins.remove",
  "moderators.create",
  "moderators.edit",
  "moderators.remove",
  "settings.update",
  "feature_flags.update",
  "audit.export",
  "notifications.broadcast",
];

module.exports = {
  PERMISSIONS,
  PERMISSION_KEYS,
  PERMISSION_SET,
  DANGEROUS_PERMISSIONS,
  SYSTEM_ROLE_KEYS,
  ROLE_RANKS,
  ROLE_META,
  permissionsForRoleKey,
  isKnownPermission,
  isDangerousPermission,
  permissionGroups,
  defaultRoleSeed,
  DEFAULT_REPORT_CATEGORIES,
  QUEUE_STATUSES,
  STRIKE_TYPES,
  HIGH_RISK_IMPERSONATION_BLOCKLIST,
  unique,
};
