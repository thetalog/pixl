import { CONNECTION, nextBackoffMs } from '~/utils/liveReconnect'
import { liveMessage, parseLiveMessage } from '~/utils/liveProtocol'

export function useLivestreamSocket() {
  const status = ref(CONNECTION.CONNECTION_LOST)
  const lastError = ref('')
  const handlers = new Set()

  let socket = null
  let attempts = 0
  let timer = null
  let heartbeat = null
  let closedByUser = false
  let url = ''

  function emit(message) {
    for (const handler of handlers) handler(message)
  }

  function onMessage(handler) {
    handlers.add(handler)
    return () => handlers.delete(handler)
  }

  function send(type, payload = {}, meta = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    socket.send(liveMessage(type, { ...meta, payload }))
    return true
  }

  function connect(nextUrl) {
    if (typeof window === 'undefined') return
    closedByUser = false
    url = nextUrl
    cleanupSocket()
    status.value = CONNECTION.RECONNECTING
    socket = new WebSocket(url)
    socket.onopen = () => {
      attempts = 0
      status.value = CONNECTION.CONNECTED
      lastError.value = ''
      startHeartbeat()
    }
    socket.onmessage = (event) => {
      const parsed = parseLiveMessage(event.data)
      if (parsed) emit(parsed)
    }
    socket.onerror = () => {
      lastError.value = 'WebSocket error'
    }
    socket.onclose = () => {
      cleanupSocket()
      if (closedByUser) {
        status.value = CONNECTION.CONNECTION_LOST
        return
      }
      status.value = CONNECTION.CONNECTION_LOST
      scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    if (closedByUser || !url) return
    status.value = CONNECTION.RECONNECTING
    const wait = nextBackoffMs(attempts)
    attempts += 1
    timer = setTimeout(() => connect(url), wait)
  }

  function startHeartbeat() {
    stopHeartbeat()
    heartbeat = setInterval(() => send('HEARTBEAT'), 15000)
  }

  function stopHeartbeat() {
    if (heartbeat) clearInterval(heartbeat)
    heartbeat = null
  }

  function disconnect() {
    closedByUser = true
    if (timer) clearTimeout(timer)
    timer = null
    stopHeartbeat()
    if (socket && socket.readyState === WebSocket.OPEN) {
      send('LEAVE_STREAM')
    }
    cleanupSocket()
    status.value = CONNECTION.CONNECTION_LOST
  }

  function cleanupSocket() {
    stopHeartbeat()
    if (!socket) return
    socket.onopen = null
    socket.onmessage = null
    socket.onerror = null
    socket.onclose = null
    try {
      socket.close()
    } catch {
      // ignore
    }
    socket = null
  }

  onBeforeUnmount(() => disconnect())

  return {
    status,
    lastError,
    connect,
    disconnect,
    send,
    onMessage,
  }
}
