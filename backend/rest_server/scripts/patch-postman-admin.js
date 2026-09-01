const fs = require("fs");

const LOGIN_TEST = `const json = pm.response.json();
const token = json.data || json.token || json.jwt;
if (token) pm.collectionVariables.set("jwt", token);
`;

function bearer() {
  return {
    type: "bearer",
    bearer: [{ key: "token", value: "{{jwt}}", type: "string" }],
  };
}

function jsonHeaders() {
  return [
    { key: "Content-Type", value: "application/json" },
    { key: "Authorization", value: "Bearer {{jwt}}" },
  ];
}

function authHeaders() {
  return [{ key: "Authorization", value: "Bearer {{jwt}}" }];
}

function url(path, query) {
  const parts = path.replace(/^\//, "").split("/").filter(Boolean);
  const rawQuery = query
    ? "?" + query.map((q) => `${q.key}=${q.value}`).join("&")
    : "";
  return {
    raw: `{{baseUrl}}${path}${rawQuery}`,
    host: ["{{baseUrl}}"],
    path: parts,
    ...(query ? { query } : {}),
  };
}

function req({ name, method, path, query, body, description, saveJwt }) {
  const item = {
    name,
    request: {
      auth: bearer(),
      method,
      header: body ? jsonHeaders() : authHeaders(),
      url: url(path, query),
      description: description || "",
    },
    response: [],
  };
  if (body) {
    item.request.body = {
      mode: "raw",
      raw: typeof body === "string" ? body : JSON.stringify(body, null, 2),
      options: { raw: { language: "json" } },
    };
  }
  if (saveJwt) {
    item.event = [
      {
        listen: "test",
        script: { type: "text/javascript", exec: LOGIN_TEST.split("\n") },
      },
    ];
    item.request.auth = { type: "noauth" };
    item.request.header = [{ key: "Content-Type", value: "application/json" }];
  }
  return item;
}

function folder() {
  return {
    name: "10. Admin & Moderator",
    description:
      "Staff APIs. Login as admin@pixl.app / PixlAdmin!2026 (SUPER_ADMIN) or moderator@pixl.app / PixlMod!2026 (MODERATOR). Login saves `jwt`. Moderators cannot call staff/settings/flag endpoints.",
    item: [
      req({
        name: "Login as Super Admin",
        method: "POST",
        path: "/auth/login",
        body: { email: "{{adminEmail}}", password: "{{adminPassword}}" },
        description: "Saves JWT into collection variable `jwt`.",
        saveJwt: true,
      }),
      req({
        name: "Login as Moderator",
        method: "POST",
        path: "/auth/login",
        body: { email: "{{moderatorEmail}}", password: "{{moderatorPassword}}" },
        description: "Saves JWT into collection variable `jwt`.",
        saveJwt: true,
      }),
      req({ name: "Staff me", method: "GET", path: "/admin/me" }),
      req({ name: "Permission catalog", method: "GET", path: "/admin/meta" }),
      req({
        name: "Dashboard",
        method: "GET",
        path: "/admin/dashboard",
        query: [
          { key: "from", value: "", description: "ISO date optional" },
          { key: "to", value: "", description: "ISO date optional" },
        ],
      }),
      req({
        name: "List users",
        method: "GET",
        path: "/admin/users",
        query: [
          { key: "q", value: "" },
          { key: "roleKey", value: "" },
          { key: "accountStatus", value: "" },
          { key: "page", value: "1" },
          { key: "limit", value: "20" },
        ],
      }),
      req({ name: "Get user", method: "GET", path: "/admin/users/{{userId}}" }),
      req({
        name: "Warn user",
        method: "POST",
        path: "/admin/users/{{userId}}/actions",
        body: { action: "warn", reason: "First warning for spam" },
      }),
      req({
        name: "Suspend user",
        method: "POST",
        path: "/admin/users/{{userId}}/actions",
        body: { action: "suspend", days: 7, reason: "Repeated policy violations" },
      }),
      req({
        name: "Ban user",
        method: "POST",
        path: "/admin/users/{{userId}}/actions",
        body: { action: "ban", reason: "Severe abuse" },
      }),
      req({
        name: "Unban / restore user",
        method: "POST",
        path: "/admin/users/{{userId}}/actions",
        body: { action: "unban", reason: "Appeal accepted" },
      }),
      req({
        name: "Force logout",
        method: "POST",
        path: "/admin/users/{{userId}}/actions",
        body: { action: "force_logout", reason: "Revoke all sessions" },
      }),
      req({
        name: "Change user role",
        method: "POST",
        path: "/admin/users/{{userId}}/role",
        body: { roleKey: "MODERATOR", reason: "Promote to moderator" },
        description: "ADMIN cannot grant SUPER_ADMIN.",
      }),
      req({
        name: "Start impersonation",
        method: "POST",
        path: "/admin/users/{{userId}}/impersonate",
        body: { reason: "Support investigation" },
      }),
      req({ name: "Stop impersonation", method: "POST", path: "/admin/impersonation/stop", body: {} }),
      req({
        name: "Moderation queue",
        method: "GET",
        path: "/admin/moderation",
        query: [
          { key: "status", value: "NEW" },
          { key: "severity", value: "" },
          { key: "assigneeId", value: "unassigned" },
          { key: "page", value: "1" },
        ],
      }),
      req({ name: "Get case", method: "GET", path: "/admin/moderation/{{caseId}}" }),
      req({
        name: "Claim case",
        method: "POST",
        path: "/admin/moderation/{{caseId}}/actions",
        body: { action: "claim", reason: "Taking this item" },
      }),
      req({
        name: "Resolve case",
        method: "POST",
        path: "/admin/moderation/{{caseId}}/actions",
        body: { action: "resolve", reason: "Policy action taken" },
      }),
      req({
        name: "List reports",
        method: "GET",
        path: "/admin/reports",
        query: [
          { key: "status", value: "NEW" },
          { key: "category", value: "" },
          { key: "page", value: "1" },
        ],
      }),
      req({ name: "Get report", method: "GET", path: "/admin/reports/{{reportId}}" }),
      req({
        name: "Resolve report",
        method: "POST",
        path: "/admin/reports/{{reportId}}/actions",
        body: { action: "resolve", reason: "Content removed" },
      }),
      req({
        name: "Dismiss report",
        method: "POST",
        path: "/admin/reports/{{reportId}}/actions",
        body: { action: "dismiss", reason: "Does not violate policy" },
      }),
      req({
        name: "File report (any user)",
        method: "POST",
        path: "/reports",
        body: {
          targetType: "POST",
          targetId: "{{postId}}",
          category: "spam",
          reason: "Unsolicited advertising",
        },
      }),
      req({
        name: "List content",
        method: "GET",
        path: "/admin/content",
        query: [
          { key: "type", value: "POST" },
          { key: "disabled", value: "" },
          { key: "page", value: "1" },
        ],
      }),
      req({
        name: "Remove content",
        method: "POST",
        path: "/admin/content/{{postId}}/actions",
        body: { type: "POST", action: "remove", reason: "Policy violation" },
      }),
      req({
        name: "Restore content",
        method: "POST",
        path: "/admin/content/{{postId}}/actions",
        body: { type: "POST", action: "restore", reason: "Appeal overturned" },
      }),
      req({
        name: "List comments",
        method: "GET",
        path: "/admin/comments",
        query: [
          { key: "q", value: "" },
          { key: "hidden", value: "" },
          { key: "page", value: "1" },
        ],
      }),
      req({
        name: "Hide comment",
        method: "POST",
        path: "/admin/comments/{{commentId}}/actions",
        body: { action: "remove", reason: "Harassment" },
      }),
      req({
        name: "List livestreams",
        method: "GET",
        path: "/admin/livestreams",
        query: [
          { key: "status", value: "LIVE" },
          { key: "page", value: "1" },
        ],
      }),
      req({ name: "Get livestream", method: "GET", path: "/admin/livestreams/{{liveId}}" }),
      req({
        name: "Stop livestream (Java force-end)",
        method: "POST",
        path: "/admin/livestreams/{{liveId}}/stop",
        body: { reason: "Hate speech on stream" },
        description: "Node authorizes; Java StreamService.forceEnd terminates media.",
      }),
      req({
        name: "Restrict host live privileges",
        method: "POST",
        path: "/admin/livestreams/hosts/{{userId}}/restrict",
        body: { reason: "Repeat live violations", revoked: true },
      }),
      req({
        name: "List appeals",
        method: "GET",
        path: "/admin/appeals",
        query: [
          { key: "status", value: "NEW" },
          { key: "page", value: "1" },
        ],
      }),
      req({
        name: "Submit appeal (any user)",
        method: "POST",
        path: "/appeals",
        body: { type: "SUSPENSION", statement: "This was a mistake; please review." },
      }),
      req({
        name: "Review appeal",
        method: "POST",
        path: "/admin/appeals/{{appealId}}/review",
        body: { decision: "UPHELD", reason: "Original decision stands" },
      }),
      req({ name: "List staff", method: "GET", path: "/admin/staff" }),
      req({ name: "List roles", method: "GET", path: "/admin/roles" }),
      req({ name: "Audit logs", method: "GET", path: "/admin/audit-logs", query: [{ key: "page", value: "1" }] }),
      req({ name: "Export audit logs", method: "GET", path: "/admin/audit-logs/export" }),
      req({ name: "Feature flags", method: "GET", path: "/admin/feature-flags" }),
      req({
        name: "Update feature flag",
        method: "POST",
        path: "/admin/feature-flags/{{flagKey}}",
        body: { enabled: true, reason: "Emergency moderation" },
      }),
      req({ name: "Settings", method: "GET", path: "/admin/settings" }),
      req({ name: "System health", method: "GET", path: "/admin/system" }),
      req({ name: "Analytics", method: "GET", path: "/admin/analytics" }),
      req({
        name: "Broadcast notification",
        method: "POST",
        path: "/admin/notifications/broadcast",
        body: { title: "Policy update", body: "Please review the community guidelines.", audience: "STAFF" },
      }),
      req({
        name: "Bulk resolve reports",
        method: "POST",
        path: "/admin/bulk",
        body: { type: "REPORT", action: "resolve", ids: ["{{reportId}}"], reason: "Handled" },
      }),
    ],
  };
}

const extraVars = [
  { key: "adminEmail", value: "admin@pixl.app" },
  { key: "adminPassword", value: "PixlAdmin!2026" },
  { key: "moderatorEmail", value: "moderator@pixl.app" },
  { key: "moderatorPassword", value: "PixlMod!2026" },
  { key: "userId", value: "REPLACE_USER_ID" },
  { key: "reportId", value: "REPLACE_REPORT_ID" },
  { key: "caseId", value: "REPLACE_CASE_ID" },
  { key: "appealId", value: "REPLACE_APPEAL_ID" },
  { key: "commentId", value: "REPLACE_COMMENT_ID" },
  { key: "flagKey", value: "emergency_moderation_mode" },
];

function upsertVars(col) {
  col.variable = col.variable || [];
  for (const v of extraVars) {
    if (!col.variable.some((x) => x.key === v.key)) col.variable.push(v);
  }
}

function patch(path) {
  const col = JSON.parse(fs.readFileSync(path, "utf8"));
  col.item = col.item.filter((f) => f.name !== "10. Admin & Moderator");
  col.item.push(folder());
  upsertVars(col);
  fs.writeFileSync(path, JSON.stringify(col, null, 2) + "\n");
  console.log("patched", path);
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error("usage: node patch-postman-admin.js <collection.json>...");
  process.exit(1);
}
for (const t of targets) patch(t);
