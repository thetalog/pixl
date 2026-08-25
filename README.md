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
- **Live** — Start/join streams with live comments
- **Media** — Upload to AWS S3, served via API proxy
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
| Live | Kurento + Java livestream server |

---

## Project structure

```
pixl/
├── frontend/
│   ├── web/                 # Nuxt web app
│   └── android/             # Flutter mobile app
├── backend/
│   ├── rest_server/         # Express REST API
│   │   ├── controller/
│   │   ├── database/
│   │   ├── routes/
│   │   ├── prisma/
│   │   └── postman/         # Postman collection
│   └── livestream_server/   # WebRTC / Kurento live backend
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

# Email (OTP)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=

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
NUXT_PUBLIC_API_BASE=https://api.pixl-personal-project.online
NUXT_PUBLIC_LIVE_WS_BASE=wss://api.pixl-personal-project.online
```

```bash
npm run dev            # http://localhost:3000
npm run build          # production build
```

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
                                  └──▶  Firebase FCM (push)
```

- **Controllers** handle HTTP, validation, and responses
- **Database layer** holds Prisma queries (shared client via `lib/prisma.js`)
- **JWT middleware** protects all routes after public auth/notification/storage endpoints

---

## Deployment

| Service | URL |
|---------|-----|
| Web | [pixl-personal-project.online](https://pixl-personal-project.online/) |
| API | [api.pixl-personal-project.online](https://api.pixl-personal-project.online) |

Backend runs on AWS EC2 behind nginx. Media is stored in S3. The web app calls the API over HTTPS.

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

See `deploy/nginx/api.conf.snippet` for the full recommended lines. The web app also compresses images before upload.

---

## License

ISC
