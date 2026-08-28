import { lanSafeApiBase } from './apiBase'

export function firstString(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0]
  return null
}

function apiBase() {
  try {
    return lanSafeApiBase(useRuntimeConfig()?.public?.apiBase)
  } catch {
    return 'https://api.pixl-personal-project.online'
  }
}

/**
 * Legacy local/MinIO URLs are not reachable from browsers in production.
 * Rewrite them through the API media proxy. AWS S3 HTTPS URLs pass through.
 */
function rewriteLegacyStorageUrl(absolute) {
  try {
    const parsed = new URL(absolute)
    const isDockerMinio = parsed.hostname === 'minio'
    const isLocalMinio =
      (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') &&
      (parsed.port === '9000' || parsed.port === '')
    if (!isDockerMinio && !isLocalMinio) return absolute
    return `${apiBase()}/storage${parsed.pathname}${parsed.search}`
  } catch {
    return absolute
  }
}

export function normalizeUrl(url) {
  const raw = firstString(url)
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) return trimmed

  const absolute =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `http://${trimmed}`

  return rewriteLegacyStorageUrl(absolute)
}

export function previewUrl(media) {
  if (!media || typeof media !== 'object') return ''
  const mimeType = String(media.mimeType || '').toUpperCase()
  const candidate = mimeType === 'VIDEO' ? (media.thumbnail ?? media.url) : (media.url ?? media.thumbnail)
  return normalizeUrl(firstString(candidate))
}

export function extractPreviewUrl(post) {
  const mediaValue = post?.media
  if (!Array.isArray(mediaValue) || mediaValue.length === 0) return ''
  return previewUrl(mediaValue[0])
}

export function isVideoMedia(media) {
  return String(media?.mimeType || '').toUpperCase() === 'VIDEO'
}

export const FALLBACK_AVATAR =
  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
