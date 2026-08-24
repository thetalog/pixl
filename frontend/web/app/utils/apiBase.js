/**
 * Normalize public API base URL from env.
 * Fixes common mistakes like:
 *   NUXT_PUBLIC_API_HOST=https://api.example.com  + PORT=3001
 *   → http://https://api.example.com:3001
 */
export function normalizeApiBase(raw) {
  let value = String(raw || '').trim()
  if (!value || value === 'undefined' || value === 'null') return ''

  // Collapse accidental double schemes
  value = value.replace(/^https?:\/\/https:\/\//i, 'https://')
  value = value.replace(/^https?:\/\/http:\/\//i, 'http://')

  // If someone stored a full URL in the "host" field and we still got http:// prefixed
  if (/^http:\/\/https:\/\//i.test(value)) {
    value = value.replace(/^http:\/\//i, '')
  }

  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }

  try {
    const url = new URL(value)
    // Drop explicit :80 / :443 (and stray :3001 when using public HTTPS domain)
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

export function resolveApiBase(runtimeConfig) {
  return normalizeApiBase(runtimeConfig?.public?.apiBase)
}
