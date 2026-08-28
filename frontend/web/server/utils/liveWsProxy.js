import net from 'node:net'

const TARGET_HOST = '127.0.0.1'
const TARGET_PORT = Number(process.env.NUXT_DEV_LIVE_WS_PORT || 8085)

function proxyLiveUpgrade(req, socket, head) {
  const path = req.url || '/'
  const upstream = net.connect(TARGET_PORT, TARGET_HOST)
  const fail = (err) => {
    if (err) console.warn('[live-ws-proxy]', err.message || err)
    try {
      socket.destroy()
    } catch {
      // ignore
    }
    try {
      upstream.destroy()
    } catch {
      // ignore
    }
  }
  socket.setNoDelay(true)
  upstream.setNoDelay(true)
  upstream.on('error', fail)
  socket.on('error', fail)
  upstream.on('connect', () => {
    const lines = [`GET ${path} HTTP/1.1`]
    for (const [key, value] of Object.entries(req.headers || {})) {
      if (value == null) continue
      const header = Array.isArray(value) ? value.join(', ') : String(value)
      if (key.toLowerCase() === 'host') {
        lines.push(`Host: ${TARGET_HOST}:${TARGET_PORT}`)
      } else {
        lines.push(`${key}: ${header}`)
      }
    }
    lines.push('', '')
    upstream.write(lines.join('\r\n'))
    if (head?.length) upstream.write(head)
    upstream.pipe(socket, { end: true })
    socket.pipe(upstream, { end: true })
  })
}

export function attachLiveWsProxy(server) {
  if (!server?.on) return

  // A dev-server restart drops every 'upgrade' listener but keeps the same
  // server, so re-install instead of treating this as already attached.
  if (server.__pixlLiveWsProxy) {
    server.__pixlLiveWsProxy()
    return
  }

  console.info('[live-ws-proxy] attached')

  let others = []
  function routeUpgrade(req, socket, head) {
    if ((req.url || '').startsWith('/ws/live')) {
      console.info('[live-ws-proxy] upgrade', String(req.url || '').split('?')[0])
      proxyLiveUpgrade(req, socket, head)
      return
    }
    for (const listener of others) {
      listener.call(server, req, socket, head)
    }
  }

  function install() {
    others = server.listeners('upgrade').filter((listener) => listener !== routeUpgrade)
    server.removeAllListeners('upgrade')
    server.on('upgrade', routeUpgrade)
  }

  // Nuxt and Vite register their own upgrade listeners slightly after this
  // hook runs, so re-run install to keep this handler in front of them.
  server.__pixlLiveWsProxy = () => {
    install()
    for (const ms of [0, 100, 500, 2000]) {
      setTimeout(install, ms)
    }
  }

  server.__pixlLiveWsProxy()
}
