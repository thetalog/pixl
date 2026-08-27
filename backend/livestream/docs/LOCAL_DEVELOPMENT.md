# Local development

Chrome treats `http://localhost` as a secure origin, so camera/mic work there without extra TLS.

## 1. Livestream stack

From `backend/livestream`:

```bash
cd backend/livestream
docker compose up -d --build
```

If a previous attempt failed (for example coturn `unable to find user turnserver`), rebuild that service and start again:

```bash
cd backend/livestream
docker compose down
docker compose up -d --build coturn
docker compose up -d
```

Check that everything is healthy:

```bash
docker compose ps
curl -s http://localhost:8085/health
curl -s http://localhost:8085/ready
```

| Service | URL / port |
|---------|------------|
| Java API | http://localhost:8085 |
| Java WS | ws://localhost:8085/ws/live |
| Janus HTTP | http://localhost:8088/janus |
| coturn | localhost:3478 (UDP/TCP), 5349 TLS |
| Redis | localhost:6379 |
| Postgres | localhost:5433 (`pixl_live` / pixl / pixl) |
| MinIO | http://localhost:9000 console :9001 |

## 2. Node API

`backend/rest_server/.env` additions:

```env
LIVESTREAM_SERVICE_URL=http://localhost:8085
LIVESTREAM_JWT_SECRET=dev-live-jwt-secret-change-me-32
LIVE_INTERNAL_SECRET=dev-internal-secret-change-me
LIVE_SIGNALING_URL=ws://localhost:8085/ws/live
```

`LIVESTREAM_JWT_SECRET` must match Java (`>= 32` characters).

```bash
cd backend/rest_server
npx prisma generate
npx prisma db push
npm run dev   # http://localhost:3001
```

## 3. Nuxt

`frontend/web/.env`:

```env
NUXT_PUBLIC_API_BASE=http://localhost:3001
NUXT_PUBLIC_LIVE_WS_BASE=ws://localhost:8085/ws/live
```

```bash
cd frontend/web
npm run dev   # http://localhost:3000
```

Sign in as usual, open **Live**, grant camera/mic, start, then join from another browser profile.

## LAN phones / non-localhost

Use HTTPS. A Caddy file is included at `docker/caddy/Caddyfile` (TLS internal on `:8443`). Point `JANUS_PUBLIC_IP` and `TURN_EXTERNAL_IP` / `TURN_PUBLIC_HOST` at an address the browser can reach, and open UDP 3478 + 10000–10200 + 49160–49200.

## Tests

```bash
cd backend/livestream && gradle test
cd backend/rest_server && npm test
cd frontend/web && npm test
```
