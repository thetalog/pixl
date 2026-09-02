/**
 * Normalize public API base URL from env.
 * Fixes common mistakes like:
 *   NUXT_PUBLIC_API_HOST=https://api.example.com  + PORT=3001
 *   → http://https://api.example.com:3001
 */
export function normalizeApiBase(raw) {
  let value = String(raw || '').trim()
  if (!value || value === 'undefined' || value === 'null') return ''

  value = value.replace(/^https?:\/\/https:\/\//i, 'https://')
  value = value.replace(/^https?:\/\/http:\/\//i, 'http://')

  if (/^http:\/\/https:\/\//i.test(value)) {
    value = value.replace(/^http:\/\//i, '')
  }

  if (!/^https?:\/\//i.test(value) && !/^wss?:\/\//i.test(value)) {
    value = `https://${value}`
  }

  try {
    const url = new URL(value)
    if (
      (url.protocol === 'https:' && (url.port === '443' || url.port === '80' || url.port === '3001')) ||
      (url.protocol === 'http:' && url.port === '80')
    ) {
      url.port = ''
    }
    return url.origin.replace(/\/$/, '')
  } catch {
    return value.replace(/\/$/, '')
  }
}

function isLoopbackHost(host) {
  const value = String(host || '').toLowerCase()
  return value === 'localhost' || value === '127.0.0.1' || value === '::1' || value === '[::1]'
}

/** Wildcard bind addresses: valid to listen on, not valid to connect to. */
function isUnspecifiedHost(host) {
  const value = String(host || '').toLowerCase()
  return value === '0.0.0.0' || value === '::' || value === '[::]'
}

export { isLoopbackHost, isUnspecifiedHost }

/**
 * When the Nuxt app is opened from a phone on LAN (http://192.168.x.x:3000),
 * env URLs like http://localhost:3001 are unreachable. Use the page hostname.
 */
export function rewriteLoopbackHost(raw, pageHost) {
  if (!raw || !pageHost || isLoopbackHost(pageHost) || isUnspecifiedHost(pageHost)) return raw
  try {
    const url = new URL(raw, `http://${pageHost}`)
    if (!isLoopbackHost(url.hostname)) return raw
    url.hostname = pageHost
    return url.toString().replace(/\/$/, '')
  } catch {
    return raw
  }
}

export function rewriteLoopbackForLan(raw) {
  if (typeof window === 'undefined') return raw
  return rewriteLoopbackHost(raw, window.location.hostname)
}

export function isPrivateLanHost(host) {
  const value = String(host || '').toLowerCase().replace(/^\[|\]$/g, '')
  if (isLoopbackHost(value)) return false
  return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(value)
}

function pageLocation() {
  return typeof window === 'undefined' ? null : window.location
}

/** Same-origin Nitro proxy so HTTPS phone pages are not mixed-content blocked. */
export const DEV_API_PROXY = '/pixl-api'
export const DEV_LIVE_WS_PROXY = '/ws/live'

export function lanSafeApiBase(configured, location = pageLocation()) {
  const normalized = normalizeApiBase(configured)
  const fallback = location ? rewriteLoopbackHost(normalized, location.hostname) : normalized
  if (!location || !isPrivateLanHost(location.hostname)) return fallback
  return `${location.origin}${DEV_API_PROXY}`
}

export function lanSafeWsBase(configured, location = pageLocation()) {
  const fallback = location ? rewriteLoopbackHost(configured, location.hostname) : configured
  if (!location) return fallback
  const securePage = location.protocol === 'https:'
  const insecureBase = /^(ws|http):\/\//i.test(String(fallback || ''))
  // Route through the same-origin proxy when the configured base is unusable:
  // a loopback base is unreachable from other devices on the LAN, and an https
  // page is not allowed to open a plain ws:// socket.
  if (isPrivateLanHost(location.hostname) || (securePage && insecureBase)) {
    const proto = securePage ? 'wss:' : 'ws:'
    return `${proto}//${location.host}${DEV_LIVE_WS_PROXY}`
  }
  return fallback
}

export function rewriteIceServers(servers, pageHost) {
  const host = pageHost || (typeof window === 'undefined' ? '' : window.location.hostname)
  if (!host || isLoopbackHost(host) || !Array.isArray(servers)) return servers || []
  // Public production pages must keep STUN/TURN hosts from the API (EC2 public IP).
  // Rewriting 127.0.0.1 to pixl-personal-project.online breaks phone viewers.
  if (!isPrivateLanHost(host)) return servers
  return servers.map((server) => {
    const urls = server?.urls
    const list = Array.isArray(urls) ? urls : urls ? [urls] : []
    return {
      ...server,
      urls: list.map((url) =>
        String(url || '')
          .replace(/localhost/gi, host)
          .replace(/127\.0\.0\.1/g, host)
      ),
    }
  })
}

export function resolveApiBase(runtimeConfig) {
  return lanSafeApiBase(runtimeConfig?.public?.apiBase)
}
