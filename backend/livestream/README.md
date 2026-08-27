# Pixl Livestream Service

Self-hosted Instagram-style livestream backend for Pixl.

This Java service is the **media and signaling control plane**. It does not store Pixl users or passwords. The existing Node.js API remains the source of truth for identity, follows, and feed metadata.

```
Nuxt  →  Node.js (auth / social / live metadata)  →  Java livestream
                                                      ↓
                                              Janus SFU (self-hosted)
                                              coturn (self-hosted)
                                              Redis + PostgreSQL
```

**Not used:** AWS IVS, Mux, Agora, Twilio, Daily, LiveKit Cloud, Cloudflare Stream, or any hosted RTC vendor.

## Why this architecture

| Choice | Why |
|--------|-----|
| Java Spring Boot | Dedicated livestream process, independent of the Express API |
| Janus VideoRoom | Self-hosted SFU: host publishes once, viewers subscribe. No per-viewer mesh, no mandatory transcoding |
| coturn | Self-hosted STUN/TURN. Time-limited credentials minted by Java |
| PostgreSQL | Livestream operational data, isolated from Pixl MongoDB |
| Redis | Presence, viewer counts, pub/sub, rate limits (not durable storage) |
| Node JWT tickets | Browser never talks to Java with the long-lived Pixl login JWT as the only check; Node mints a short-lived live token |

The older Kurento prototype in `backend/livestream_server` is superseded.

## Quick start

```bash
cd backend/livestream
cp .env.example .env   # optional; compose has dev defaults
docker compose up -d --build
```

Then point Node at Java:

```env
LIVESTREAM_SERVICE_URL=http://localhost:8085
LIVESTREAM_JWT_SECRET=dev-live-jwt-secret-change-me-32
LIVE_INTERNAL_SECRET=dev-internal-secret-change-me
```

OpenAPI UI: http://localhost:8085/swagger-ui.html  
Health: http://localhost:8085/health  
Ready: http://localhost:8085/ready  
WebSocket: `ws://localhost:8085/ws/live?token=...`

## Docs

- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [API.md](docs/API.md)
- [WEBSOCKET_PROTOCOL.md](docs/WEBSOCKET_PROTOCOL.md)
- [WEBRTC.md](docs/WEBRTC.md)
- [LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)
- [PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## Tests

```bash
cd backend/livestream
gradle test
```
