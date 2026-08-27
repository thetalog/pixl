# WebSocket protocol

Endpoint: `LIVE_SIGNALING_URL` (default `ws://localhost:8085/ws/live?token=<live-jwt>`)

All frames are JSON text:

```json
{
  "type": "OFFER",
  "streamId": "java-uuid",
  "senderId": "pixl-user-id",
  "payload": {}
}
```

This protocol is independent of Vue component names.

## Client → server

| type | payload | who |
|------|---------|-----|
| `JOIN_STREAM` | `{}` | host or viewer, after `READY` |
| `RECONNECT` | `{}` | same as join after a drop |
| `LEAVE_STREAM` | `{}` | anyone |
| `OFFER` | `{ "sdp": "...", "type": "offer" }` | host publish |
| `ANSWER` | `{ "sdp": "...", "type": "answer" }` | viewer subscribe |
| `ICE_CANDIDATE` | RTCIceCandidateInit | both |
| `HEARTBEAT` | `{}` | both, ~every 15s |
| `CHAT_MESSAGE` | `{ "message": "..." }` | comment permission |
| `CHAT_DELETE` | `{ "id": "..." }` | host/moderator |
| `REACTION` | `{ "kind": "LIKE" }` | like permission |
| `REMOVE_VIEWER` | `{ "userId": "..." }` | host/moderator |

## Server → client

| type | meaning |
|------|---------|
| `READY` | WS authenticated |
| `ICE_SERVERS` | STUN/TURN list (also sent on REST join) |
| `ANSWER` | Janus answer to host offer |
| `SUBSCRIBER_OFFER` | Janus offer for a viewer |
| `ICE_CANDIDATE` | from media layer when trickle is used |
| `STREAM_STARTED` | host is LIVE |
| `STREAM_ENDED` | tear down playback |
| `VIEWER_JOINED` / `VIEWER_LEFT` | presence |
| `VIEWER_COUNT` | authoritative count |
| `CHAT_MESSAGE` / `CHAT_DELETE` | chat |
| `REACTION` | aggregated totals |
| `ERROR` | `{ "message": "..." }` |

Chat limits: 280 chars, 20 messages / user / minute / stream.

Heartbeat timeout: 60s (server drops ghost viewers).
