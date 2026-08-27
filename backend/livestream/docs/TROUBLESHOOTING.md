# Troubleshooting

## Camera permission denied

Use `http://localhost` or HTTPS. `http://127.0.0.1` is usually OK; `http://<LAN-IP>` is not a secure context in Chrome.

## Stream created but no video

1. `GET http://localhost:8085/ready` — `media` should be `ok`
2. Janus logs: room create / webrtcup
3. Browser `chrome://webrtc-internals` — ICE state
4. If host is on another network, confirm UDP 3478 and RTP range, and `TURN_PUBLIC_HOST` is the address **browsers** use (not `coturn` docker DNS)

## ICE failed

- `TURN_SECRET` mismatch between Java and coturn
- `JANUS_PUBLIC_IP` still `127.0.0.1` while the viewer is on another machine
- Firewall dropping UDP
- Signaling WS connected but media ports unpublished

## 401 from Java WS

Live token missing/expired, or `LIVESTREAM_JWT_SECRET` differs between Node and Java, or secret shorter than 32 characters on one side.

## 401 on Node `/internal/live/...`

`LIVE_INTERNAL_SECRET` mismatch.

## Viewer count stuck

Heartbeats not sent (client should send `HEARTBEAT`). Server reaps after 60s. Redis down falls back to in-memory (wrong count across Java replicas).

## Host refresh

Reconnect within 45s keeps the session; after that the stream ends. Host should open `/live/:id?host=1` again only for a **new** publish; ended streams are not restarted in place.

## Prisma errors after pull

```bash
cd backend/rest_server
npx prisma generate
npx prisma db push
```

New `LiveStream` fields (`status`, `visibility`, `javaStreamId`, …) must exist in Mongo.

## Old Kurento server

`backend/livestream_server` (port 9090) is the previous prototype. Do not run it alongside this stack.
