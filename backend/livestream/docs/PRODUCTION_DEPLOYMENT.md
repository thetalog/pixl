# Production deployment

Ordinary HTTP-only PaaS (single port 80, no UDP) is **not** enough for WebRTC.

## DNS

| Host | Role |
|------|------|
| `pixl.example` | Nuxt |
| `api.pixl.example` | Node |
| `live.pixl.example` | Java HTTPS + WSS |
| `turn.pixl.example` | coturn |

Janus RTP should hit the media host public IP (or 1:1 NAT). Set `JANUS_PUBLIC_IP` and coturn `external-ip`.

## TLS / reverse proxy

Terminate TLS on nginx/Caddy for Node, Nuxt, and Java.

WebSocket proxy requirements:

```
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 3600s;
```

Do not buffer WS. See `deploy/nginx/live.conf.snippet`.

## Firewall / UDP

| Port | Proto | Why |
|------|-------|-----|
| 443 | TCP | HTTPS / WSS |
| 3478 | UDP+TCP | STUN/TURN |
| 5349 | TCP | TURNS |
| 10000–10200 | UDP | Janus RTP (adjust to your range) |
| 49160–49200 | UDP | coturn relays |

Allow UDP. TCP-only TURN is a degraded fallback (`?transport=tcp`).

## Scaling

- Multiple Java instances behind a load balancer; Redis required
- Sticky WS is optional because each connection creates its own Janus handle
- Scale Janus separately when a single SFU is CPU/network bound
- Postgres for stream rows; Redis is not a backup store
- Recordings: MinIO or other S3-compatible storage you run

## Monitoring / logging

- Java structured logs: `stream created|started|ended`, host connect/disconnect, viewer join/leave, negotiation/ICE failures
- `/health`, `/ready`, `/actuator/prometheus`
- Tail Janus and coturn containers

## Storage / backups

- Postgres: standard dumps
- MinIO/recordings: object-store versioning
- Mongo (Pixl): existing backup process
- Redis: ephemeral; do not rely on AOF for live presence

## Secrets

Rotate `LIVE_INTERNAL_SECRET`, `LIVESTREAM_JWT_SECRET`, `TURN_SECRET` independently of the Pixl login `JWT_SECRET_KEY`. Never put internal/TURN shared secrets in Nuxt env.
