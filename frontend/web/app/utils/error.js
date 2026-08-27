export function apiErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.data

  if (typeof data === 'string' && data.trim()) return data
  if (typeof data?.message === 'string' && data.message.trim()) return data.message
  if (typeof data?.error === 'string' && data.error.trim()) return data.error

  const status = error?.statusCode || error?.status || data?.status
  if (status === 401) return 'Please sign in again.'
  if (status === 403) return 'You do not have permission to do that.'
  if (status === 404) return 'Not found.'
  if (status === 451) return data?.message || 'This content was blocked by moderation.'
  if (status >= 500) return 'Server error. Please try again.'

  const raw = typeof error?.message === 'string' ? error.message.trim() : ''
  if (raw.includes('Invalid `prisma') || raw.includes('Unknown argument')) {
    return 'Livestream schema is out of date. Restart the API after prisma generate.'
  }
  // ofetch default: [POST] "https://…/auth/login": 404 Not Found — hide raw URL noise
  if (raw && raw.length < 180 && !/^\[(GET|POST|PUT|PATCH|DELETE)\]\s+"/i.test(raw)) {
    return raw
  }

  return fallback
}

export function apiList(res, keys = ['data', 'conversations', 'messages', 'details']) {
  if (Array.isArray(res)) return res
  for (const key of keys) {
    if (Array.isArray(res?.[key])) return res[key]
  }
  return []
}
