# Pixl

Instagram-style social platform with posts, reels, stories, messaging, and live streaming.

**Live app:** [https://pixl-personal-project.online/](https://pixl-personal-project.online/)  
**API:** [https://api.pixl-personal-project.online](https://api.pixl-personal-project.online)

---

## Features

- **Auth** — Email OTP verification, signup, login (JWT)
- **Feed** — Posts, reels, stories from followed users and public explore
- **Social** — Likes, saves, comments, hashtags, share links, follow requests
- **Profile** — Bio, visibility, profile picture, posts grid, saved posts
- **Messaging** — Direct and group chat with media attachments
- **Live** — Self-hosted WebRTC livestreams (Java + Janus SFU + coturn), live comments, reactions
- **Media** — Upload to AWS S3, served via API proxy
- **Moderation** — Staff console (roles, reports, appeals, audit logs); Amazon Rekognition blocks unsafe photos; alerts appear under Activity (♡)
- **AI search** — Natural-language image search + visual similarity
- **Push** — Firebase Cloud Messaging (optional)

---

## Tech stack

| Layer | Stack |
|-------|--------|
| Web | Nuxt 4, Vue 3, Tailwind CSS |
| API | Node.js, Express 5, Prisma 6 |
| Database | MongoDB (replica set) |
| Storage | AWS S3 |
| Mobile | Flutter (Android / iOS) |
| Live | Java 21 Spring Boot + Janus SFU + coturn + Redis + Postgres |

---

## Project structure

```
pixl/
├── frontend/
│   ├── web/                 # Nuxt web app
│   └── android/             # Flutter mobile app
├── backend/
│   ├── rest_server/         # Express REST API
│   ├── livestream/          # Self-hosted livestream (Java)
│   └── livestream_server/   # Deprecated Kurento prototype
└── README.md
```

---

## Getting started

### Backend

```bash
cd backend/rest_server
npm install
# edit .env with your values (see below)
npx prisma generate
npx prisma db push
npm run dev            # http://localhost:3001
```

Configure `backend/rest_server/.env`:

```env
PORT=3001
DATABASE_URL=mongodb://...
JWT_SECRET_KEY=...

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
S3_BUCKET_POSTS=
S3_BUCKET_DM=
S3_BUCKET_GROUP_MSG=
S3_BUCKET_GROUP_DP=
S3_BUCKET_PROFILE=

# Rekognition (same AWS keys; enable DetectModerationLabels + DetectLabels on the IAM user)
# REKOGNITION_MODERATION_MIN_CONFIDENCE=75

# Email (OTP)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=

# Livestream (Java service)
LIVESTREAM_SERVICE_URL=http://localhost:8085
LIVESTREAM_JWT_SECRET=dev-live-jwt-secret-change-me-32
LIVE_INTERNAL_SECRET=dev-internal-secret-change-me
LIVE_SIGNALING_URL=ws://localhost:8085/ws/live

# Staff bootstrap (created on API start / npm run seed:admin)
# ADMIN_BOOTSTRAP_EMAIL=admin@pixl.app
# ADMIN_BOOTSTRAP_PASSWORD=PixlAdmin!2026
# ADMIN_MODERATOR_EMAIL=moderator@pixl.app
# ADMIN_MODERATOR_PASSWORD=PixlMod!2026


# Firebase (optional)
FIREBASE_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Web frontend

```bash
cd frontend/web
npm install
```

Set `frontend/web/.env`:

```env
NUXT_PUBLIC_API_BASE=http://localhost:3001
NUXT_PUBLIC_LIVE_WS_BASE=ws://localhost:8085/ws/live

```

```bash
npm run dev            # http://localhost:3000
npm run build          # production build
```

### Self-hosted livestream

```bash
cd backend/livestream
docker compose up -d --build
```

Docs: `backend/livestream/README.md` and `backend/livestream/docs/LOCAL_DEVELOPMENT.md`.

### Flutter app

```bash
cd frontend/android
flutter pub get
flutter run
```

---

## API documentation

Import the Postman collection:

```
backend/rest_server/postman/Pixl_API.postman_collection.json
```

1. Set collection variable `baseUrl` → `https://api.pixl-personal-project.online`
2. Run **Auth → Login**
3. Paste JWT into variable `jwt`
4. Call protected routes (Bearer auth is pre-configured)

### Route overview

| Area | Base path | Auth |
|------|-----------|------|
| Health | `GET /` | Public |
| Auth / OTP | `/send-otp`, `/verify-otp`, `/auth/login`, `/auth/signup` | Public |
| Notifications | `/send`, `/bulk` | Public |
| Posts & stories | `/posts/*` | JWT |
| Messages | `/message/*` | JWT |
| Users & follow | `/users/*` | JWT |
| Profile | `/profile/*` | JWT |
| Live | `/live/*` | JWT |
| Admin | `/admin/*` | JWT + staff RBAC |
| Reports | `/reports` | JWT |
| Appeals | `/appeals` | JWT |
| Media proxy | `GET /storage/:bucket/:key` | Public |

---

## Architecture

```
Browser / Mobile
      │
      ▼
  Nuxt / Flutter  ──HTTPS──▶  Express API  ──▶  MongoDB (Prisma)
                                  │
                                  ├──▶  AWS S3 (media)
                                  ├──▶  SMTP (OTP email)
                                  ├──▶  Firebase FCM (push)
                                  └──▶  Java livestream ──▶ Janus SFU + coturn
```

- **Controllers** handle HTTP, validation, and responses
- **Database layer** holds Prisma queries (shared client via `lib/prisma.js`)
- **JWT middleware** protects all routes after public auth/notification/storage endpoints
- **Livestream** signaling and media run on infrastructure you operate (not a hosted RTC vendor)
- **Admin / moderator** console lives at `/admin` (see `docs/ADMIN.md`). Livestream termination is executed by the Java service (`POST /internal/v1/streams/{id}/force-end`), never by a Nuxt flag.

---

## Deployment

| Service | URL |
|---------|-----|
| Web | [pixl-personal-project.online](https://pixl-personal-project.online/) |
| API | [api.pixl-personal-project.online](https://api.pixl-personal-project.online) |

Backend runs on AWS EC2 behind nginx. Media is stored in S3. The web app calls the API over HTTPS.

Manual API deploy (EC2 + SSL): [DEPLOYMENT.md](DEPLOYMENT.md).

### Upload / “Failed to fetch” on create post

nginx defaults to `client_max_body_size 1m`. Photos larger than ~1MB are rejected before Express, and the browser shows `Failed to fetch`.

On the API host:

```bash
# edit the api.pixl-personal-project.online server block
sudo nano /etc/nginx/sites-available/api.pixl-personal-project.online
# add inside server { }:
#   client_max_body_size 50M;

sudo nginx -t && sudo systemctl reload nginx
```

The web app also compresses images before upload. Full nginx + SSL steps are in [DEPLOYMENT.md](DEPLOYMENT.md).

---

## License

ISC

chrome://flags/#enable-webrtc-hide-local-ips-with-mdns