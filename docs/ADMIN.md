# Admin and Moderator system

Pixl’s staff console is part of the existing Express + Nuxt app. Privileged actions are enforced on the **server**. The web UI only hides buttons; it is not a security boundary.

## Architecture

```
Staff browser (Nuxt /admin)
        │  Pixl JWT
        ▼
Express /admin/*  ── RBAC + audit ── MongoDB
        │
        │ livestreams.stop / restrict (active session)
        ▼
Java livestream  POST /internal/v1/streams/{id}/force-end
        │
        ▼
Janus room destroyed, STREAM_ENDED fanout, Node status callback
```

Node.js is the authenticated application gateway. The Java livestream service is authoritative for media session lifecycle. The Nuxt live WebSocket proxy is a tunnel only and must never be used to terminate a stream.

## Roles

| Role | Rank | Intent |
|------|------|--------|
| SUPER_ADMIN | 100 | Full platform authority |
| ADMIN | 80 | Platform administration; cannot grant SUPER_ADMIN |
| MODERATOR | 60 | Content, reports, livestreams, appeals |
| SUPPORT | 40 | Account lookup, notes, limited visibility |
| ANALYST | 20 | Read-only analytics and health |
| USER | 0 | Normal app |

Custom roles can be added in **Roles & permissions**. Rank must stay below the actor’s rank. System roles cannot be archived.

## Permissions

Keys live in `backend/rest_server/lib/admin/permissions.js`. Effective grants:

1. Role permissions (Role collection, seeded for system roles)
2. Plus `User.directPermissions`
3. Minus `User.deniedPermissions`
4. SUPER_ADMIN always receives the full catalog

Frontend `can()` is UX only. Every mutation goes through `requirePermission` **and** a service-layer `hasPermission` check.

### Adding a permission

1. Add it to `PERMISSIONS` in `lib/admin/permissions.js`.
2. Grant it on the appropriate default role lists in the same file.
3. Restart the API so `seedRoles()` updates system roles.
4. Guard the new API with `requirePermission("your.perm")` and a service check.
5. Add the nav item / button with `admin.can("your.perm")`.

### Adding a role

Use the Roles UI (requires `admins.edit`) or insert a `Role` document. Do not reuse reserved keys (`SUPER_ADMIN`, `ADMIN`, `MODERATOR`, `SUPPORT`, `ANALYST`, `USER`).

### Adding a moderator action

1. Implement it in `lib/admin/service.js` with permission + reason + `recordAction` / `writeAudit`.
2. Expose it under `/admin/...`.
3. For livestream **state** (stop / destroy session), call `livestreamClient.forceEndStream` so Java `StreamService.forceEnd` runs. Do not only flip Mongo `LiveStream.status`.

## Route protection

- `/admin/*` — JWT + staff role (`roleKey !== USER`) + permission middleware
- `/reports` — JWT (any user may file a report)
- `/appeals` — JWT (banned/suspended users may still submit and list their appeals)

Client middleware `staff.js` only controls navigation.

## API (all under `/admin` unless noted)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/admin/me` | staff |
| GET | `/admin/dashboard` | analytics.read or moderation.read or users.read |
| GET | `/admin/users` | users.read |
| POST | `/admin/users/:id/actions` | action-specific (warn/suspend/ban/…) |
| POST | `/admin/users/:id/role` | admins.edit / moderators.edit |
| POST | `/admin/users/:id/impersonate` | users.impersonate |
| POST | `/admin/impersonation/stop` | impersonation session |
| GET/POST | `/admin/reports`, `/admin/reports/:id/actions` | reports.* |
| GET/POST | `/admin/moderation`, `/admin/moderation/:id/actions` | moderation.* |
| GET/POST | `/admin/content/:id/actions` | content.* |
| GET/POST | `/admin/comments/:id/actions` | comments.* |
| GET | `/admin/livestreams` | livestreams.read |
| POST | `/admin/livestreams/:id/stop` | livestreams.stop |
| POST | `/admin/livestreams/hosts/:userId/restrict` | livestreams.restrict |
| GET/POST | `/admin/appeals/:id/review` | moderation.appeal |
| GET/POST | `/admin/roles` | admins.* |
| GET | `/admin/audit-logs` | audit.read |
| GET | `/admin/audit-logs/export` | audit.export |
| POST | `/admin/notifications/broadcast` | notifications.broadcast |
| POST | `/admin/feature-flags/:key` | feature_flags.update |
| POST | `/admin/bulk` | moderation.act / reports.resolve |
| POST | `/reports` | any authenticated user |
| GET/POST | `/appeals` | any authenticated user |

Request bodies cannot set `roleKey` or permissions except on the dedicated role/permission endpoints, which ignore extra fields (`pickAllowedBody`).

## Database

MongoDB collections added via Prisma (`prisma/schema.prisma`). This project uses **`npx prisma db push`** (no SQL migration folder; MongoDB).

New models: `Role`, `StaffAssignment`, `Report`, `ModerationCase`, `ModerationAction`, `ModerationNote`, `ModerationStrike`, `Appeal`, `AuditLog`, `FeatureFlag`, `SystemSetting`, `AdminAnnouncement`, `ImpersonationSession`.

User fields added: `roleKey`, `directPermissions`, `deniedPermissions`, `accountStatus`, `suspendedUntil`, `sessionVersion`, `livePrivilegesRevoked`, `commentsLocked`, `featureRestrictions`, `deletedAt`, `lastLoginAt`.

Content: `Post.postDisabledById`, `Post.commentsLocked`, `Comment.hidden*`, `Reels.hidden*`, `Stories.hidden*`, `LiveStream.terminatedById`.

Audit logs have **no update API**.

## Moderation lifecycle

Report (or automated source) → `ModerationCase` (NEW) → claim (`IN_REVIEW`, optimistic `version`) → action (hide/warn/suspend/stop live) → `ACTION_TAKEN` / `RESOLVED` / `DISMISSED` / `ESCALATED`.

Appeals: another staff member should overturn a high-risk decision unless `moderation.override` is granted (`SEPARATION_OF_DUTIES`).

Livestream stop: Java `forceEnd` must succeed before Mongo is marked `ENDED` by the admin service (Java also callbacks `/internal/live/:id/status`).

## Impersonation

Issues a JWT for the target with `impersonatorId` + `impersonationId`. High-risk admin mutations are blocked while the flag is set. UI shows a persistent banner and **Return to my account**.

## First super admin

On API start (or `npm run seed:admin`), `seedAdminSystem()` creates or updates staff accounts from env:

```
ADMIN_BOOTSTRAP_EMAIL=admin@pixl.app
ADMIN_BOOTSTRAP_PASSWORD=PixlAdmin!2026
ADMIN_MODERATOR_EMAIL=moderator@pixl.app
ADMIN_MODERATOR_PASSWORD=PixlMod!2026
```

If the email already exists, that user is promoted and the password is reset to the env value.

## Feature flags

`registrations_disabled`, `comments_disabled`, `uploads_disabled`, `livestreaming_disabled`, `maintenance_mode`, `emergency_moderation_mode`.

Safe default: all **off**. `emergency_moderation_mode` holds new posts (`postDisabled`) for review.

## Security notes

- Do not trust `role` in JSON bodies.
- `req.user.password` is still used internally for profile password change; `/users/profile` strips it.
- Admin mutations are rate-limited (in-memory, per user).
- Concurrent queue claims use `version` optimistic locking (409 CONFLICT).
- Livestream terminate is not exposed on public `/live/:id` for non-hosts.

## Deploy / migrate

```bash
cd backend/rest_server
npx prisma generate
npx prisma db push
# optional — creates SUPER_ADMIN + MODERATOR if missing
export ADMIN_BOOTSTRAP_EMAIL=admin@pixl.app
export ADMIN_BOOTSTRAP_PASSWORD=PixlAdmin!2026
export ADMIN_MODERATOR_EMAIL=moderator@pixl.app
export ADMIN_MODERATOR_PASSWORD=PixlMod!2026
npm run seed:admin
npm run dev
```

Java livestream (for stop-stream):

```bash
cd backend/livestream
# rebuild if you pull force-end endpoint
docker compose up -d --build
```

`LIVE_INTERNAL_SECRET` must match Node and Java.
