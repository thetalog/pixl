export function firstString(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0]
  return null
}

export function normalizeUrl(url) {
  const raw = firstString(url)
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed
  }
  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) return trimmed
  return `http://${trimmed}`
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
