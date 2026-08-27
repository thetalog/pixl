# HTTP API

OpenAPI UI is served by the Java service at `/swagger-ui.html` (`/api-docs`).

The **browser should call Node** (`/live/*`). Java REST is for Node (internal) and token-authenticated ICE refresh.

## Authentication

| Caller | Mechanism |
|--------|-----------|
| Node → Java | Header `X-Internal-Secret` |
| Nuxt → Java REST | `Authorization: Bearer <live token>` |
| Nuxt → Java WS | Query `?token=` (same live token) |
| Nuxt → Node | Existing Pixl `Authorization: Bearer <jwt>` |

Live tokens: HS256, issuer `pixl-node`, audience `pixl-livestream`, ~2 hours, claims `sub` (user id), `userName`, `streamId`, `role`, `permissions`.

## Node routes (Pixl API)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/live` | Active LIVE streams the caller may see |
| POST | `/live/start` | Create stream (title, visibility, recordingEnabled) |
| GET | `/live/:liveId` | Metadata + live session token if joinable |
| POST | `/live/:liveId/join` | Join + session token |
| POST | `/live/:liveId/leave` | Leave |
| DELETE | `/live/:liveId` | Host ends stream |
| GET | `/live/:liveId/viewers` | Viewer list (from Java) |
| POST | `/live/:liveId/comment` | Persist comment (WS is primary) |
| GET | `/live/:liveId/comments` | Comment history |
| POST | `/internal/live/:liveId/status` | Java callback |
| POST | `/internal/live/:liveId/comment` | Java callback |

## Java internal routes

Base: `/internal/v1/streams`

- `POST /` create
- `POST /{id}/start`
- `POST /{id}/end`
- `GET /{id}`
- `POST /{id}/join`
- `POST /{id}/leave`
- `GET /{id}/viewers`
- `GET /{id}/ice`
- `GET /` list LIVE

`{id}` may be the Java UUID or the Pixl Mongo id.

## Java client routes

Base: `/api/v1/streams` (live token)

- `GET /{id}`
- `GET /{id}/viewers`
- `GET /{id}/ice`
- `POST /{id}/end`

## Errors

```json
{
  "error": true,
  "status": 403,
  "code": "FORBIDDEN",
  "message": "Only the host can end this stream",
  "path": "/internal/v1/streams/...",
  "timestamp": "..."
}
```

## Health

- `GET /health` — process up
- `GET /ready` — database required; redis/media reported
- Actuator: `/actuator/prometheus`
