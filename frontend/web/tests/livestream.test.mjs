import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextBackoffMs, CONNECTION } from '../app/utils/liveReconnect.js'
import { liveMessage, parseLiveMessage } from '../app/utils/liveProtocol.js'

test('reconnect backoff grows but is capped', () => {
  const first = nextBackoffMs(0, { base: 500, max: 8000 })
  const later = nextBackoffMs(10, { base: 500, max: 8000 })
  assert.ok(first >= 500 && first <= 700)
  assert.ok(later >= 8000 && later <= 8200)
  assert.equal(CONNECTION.RECONNECTING, 'RECONNECTING')
})

test('signaling payload is protocol-shaped', () => {
  const raw = liveMessage('OFFER', { streamId: 's1', senderId: 'u1', payload: { sdp: 'v=0' } })
  const parsed = parseLiveMessage(raw)
  assert.equal(parsed.type, 'OFFER')
  assert.equal(parsed.streamId, 's1')
  assert.equal(parsed.payload.sdp, 'v=0')
  assert.equal(parseLiveMessage('not-json'), null)
})

test('LAN phone access rewrites localhost API and websocket URLs', async () => {
  const { rewriteLoopbackHost } = await import('../app/utils/apiBase.js')
  assert.equal(
    rewriteLoopbackHost('http://localhost:3001', '192.168.1.20'),
    'http://192.168.1.20:3001'
  )
  assert.equal(
    rewriteLoopbackHost('ws://localhost:8085/ws/live', '192.168.1.20'),
    'ws://192.168.1.20:8085/ws/live'
  )
  assert.equal(
    rewriteLoopbackHost('http://localhost:3001', 'localhost'),
    'http://localhost:3001'
  )
})

test('LAN phone uses same-origin API and websocket proxies', async () => {
  const { lanSafeApiBase, lanSafeWsBase } = await import('../app/utils/apiBase.js')
  const lan = {
    hostname: '192.168.1.104',
    host: '192.168.1.104:3000',
    origin: 'https://192.168.1.104:3000',
    protocol: 'https:',
  }
  assert.equal(lanSafeApiBase('http://localhost:3001', lan), 'https://192.168.1.104:3000/pixl-api')
  assert.equal(lanSafeWsBase('ws://localhost:8085/ws/live', lan), 'wss://192.168.1.104:3000/ws/live')
  assert.equal(
    lanSafeApiBase('https://api.pixl-personal-project.online', {
      hostname: 'pixl-personal-project.online',
      origin: 'https://pixl-personal-project.online',
    }),
    'https://api.pixl-personal-project.online'
  )
})

test('LAN phone rewrites ICE servers off localhost', async () => {
  const { rewriteIceServers } = await import('../app/utils/apiBase.js')
  const ice = rewriteIceServers(
    [{ urls: ['stun:localhost:3478', 'turn:127.0.0.1:3478?transport=udp'] }],
    '192.168.1.104'
  )
  assert.equal(ice[0].urls[0], 'stun:192.168.1.104:3478')
  assert.equal(ice[0].urls[1], 'turn:192.168.1.104:3478?transport=udp')
})
