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

export { isLoopbackHost }

/**
 * When the Nuxt app is opened from a phone on LAN (http://192.168.x.x:3000),
 * env URLs like http://localhost:3001 are unreachable. Use the page hostname.
 */
export function rewriteLoopbackHost(raw, pageHost) {
  if (!raw || !pageHost || isLoopbackHost(pageHost)) return raw
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
  if (!location || !isPrivateLanHost(location.hostname)) return fallback
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}${DEV_LIVE_WS_PROXY}`
}

export function rewriteIceServers(servers, pageHost) {
  const host = pageHost || (typeof window === 'undefined' ? '' : window.location.hostname)
  if (!host || isLoopbackHost(host) || !Array.isArray(servers)) return servers || []
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
