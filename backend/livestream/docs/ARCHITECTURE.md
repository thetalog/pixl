# Architecture

## Current Pixl (unchanged)

- **Nuxt 4** web client, cookie JWT, `$fetch` via `usePixlApi`
- **Express 5** API, Prisma/MongoDB, Bearer JWT (`email`/`userName` claims, 30 days)
- Users, follows, posts, notifications stay in Node/Mongo

## Livestream split

```
                 ┌─────────────────────┐
                 │     Nuxt.js         │
                 └──────────┬──────────┘
                            │ HTTPS + Bearer Pixl JWT
                 ┌──────────▼──────────┐
                 │     Node.js         │
                 │  /live/*            │
                 │  mints live token   │
                 └──────────┬──────────┘
                            │ X-Internal-Secret
                 ┌──────────▼──────────┐
                 │  Java livestream    │
                 │  sessions, WS, chat │
                 └──────────┬──────────┘
                            │ HTTP to Janus
                 ┌──────────▼──────────┐
                 │ Janus SFU + coturn  │
                 └─────────────────────┘
```

### Data ownership

| Data | Store |
|------|--------|
| Users, follows, Pixl JWT | MongoDB (existing) |
| Live discovery row (title, host, status, comments) | MongoDB `LiveStream` |
| Operational session, Janus room, recordings, chat copy | PostgreSQL (this service) |
| Viewer presence, heartbeats, reaction counters, WS fan-out | Redis |
| Optional recording objects | Local disk or MinIO |

Mongo keeps a **social copy** so the feed/right-rail can list lives without calling Java for every page. Java is authoritative for WebRTC, viewer count, and in-stream chat.

### Media path (SFU, not mesh)

```
Host camera  --WebRTC-->  Janus VideoRoom  --WebRTC-->  Viewer
                              ▲
                              │ signaling HTTP
                         Java service
```

The host publishes **one** stream. Janus forwards RTP to subscribers. This is the Instagram Live pattern and scales past a host-to-every-viewer mesh.

Kurento was an MCU (transcode everything). Janus VideoRoom is an SFU (forward compatible codecs). FFmpeg transcoding is **not** in the live path; it would be an isolated later pipeline.

### Auth

1. Browser authenticates to Node as today.
2. Node `POST /live/start` or `POST /live/:id/join` after checking Pixl identity and visibility (public / followers).
3. Node signs a **2-hour** JWT (`iss=pixl-node`, `aud=pixl-livestream`) with `LIVESTREAM_JWT_SECRET`.
4. Nuxt opens `ws://java/ws/live?token=...`. Java validates that token. A raw `userId` from the browser is never trusted.

Internal Node ↔ Java REST uses `X-Internal-Secret`. That secret is never sent to Nuxt.

Platform staff terminate a stream through Node `/admin/livestreams/:id/stop`, which calls Java `POST /internal/v1/streams/{id}/force-end`. That runs `StreamService.forceEnd` (destroys the Janus room). Host-only `/end` stays host-gated. The Nuxt `/ws/live` proxy must not be used as a kill switch.

### Scaling later

```
        LB (sticky WS optional)
     Java #1   Java #2
         \      /
          Redis
            |
          Janus (or Janus cluster)
```

Each Java instance creates its own Janus session per browser connection and joins the **same VideoRoom**. Chat and viewer events go through Redis pub/sub. Durable stream rows live in PostgreSQL.

### Failure behavior

| Event | Behavior |
|-------|----------|
| Host network blip | Reconnect window (`HOST_RECONNECT_WINDOW_SECONDS`, default 45s). Stream stays LIVE |
| Host timeout | Stream ENDED, viewers get `STREAM_ENDED` |
| Viewer disconnect / tab crash | Heartbeat timeout removes presence; count is server-authoritative |
| Java restart | Client reconnects WS; Janus room may need host republish |
| Janus restart | Publish fails; stream marked failed / host retries |
| TURN down | Host-only LAN/localhost may still work via host candidates; remote viewers fail ICE |
| Redis down | In-memory fallback on that JVM (not multi-instance safe) |
| Node down | Existing live tokens still work until expiry; new joins cannot be minted |
| Postgres down | Control APIs fail; `/health` stays up, `/ready` is degraded |
