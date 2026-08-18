export function apiErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.data
  if (typeof data === 'string' && data.trim()) return data
  if (typeof data?.message === 'string' && data.message.trim()) return data.message
  if (typeof error?.message === 'string' && error.message.trim()) return error.message
  return fallback
}

export function apiList(res, keys = ['data', 'conversations', 'messages', 'details']) {
  if (Array.isArray(res)) return res
  for (const key of keys) {
    if (Array.isArray(res?.[key])) return res[key]
  }
  return []
}
