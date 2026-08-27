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

export function resolveApiBase(runtimeConfig) {
  return rewriteLoopbackForLan(normalizeApiBase(runtimeConfig?.public?.apiBase))
}
