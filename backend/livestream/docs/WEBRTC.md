# WebRTC

## Path

```
Camera/Mic
  → getUserMedia (secure origin)
  → RTCPeerConnection
  → DTLS-SRTP
  → Janus VideoRoom (self-hosted SFU)
  → viewer RTCPeerConnection
```

Video is **not** uploaded as HTTP chunks.

## ICE

Java mints time-limited TURN REST credentials (HMAC-SHA1, coturn `use-auth-secret`):

- STUN UDP
- TURN UDP
- TURN TCP
- TURNS TLS (port 5349)

Configure via `TURN_SERVER`, `TURN_SECRET`, `TURN_REALM`. Do not put the shared secret in Nuxt. Only short-lived `username`/`credential` go to the browser.

## Codecs

Prefer whatever the browser and Janus negotiate (typically VP8/H264 + Opus). No transcoding in v1.

## Recording

Optional. When `recordingEnabled` is true, Java records a row and Janus can write into `RECORDING_LOCAL_PATH` or an S3-compatible bucket (MinIO). Recording is off by default.

## Browser security

`getUserMedia` requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts): `https://` or `http://localhost`. Plain `http://192.168.x.x` will be blocked. See LOCAL_DEVELOPMENT.md.
