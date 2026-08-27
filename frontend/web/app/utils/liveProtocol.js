export function liveMessage(type, { streamId, senderId, payload } = {}) {
  return JSON.stringify({
    type,
    streamId: streamId || '',
    senderId: senderId || '',
    payload: payload || {},
  })
}

export function parseLiveMessage(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!data || typeof data.type !== 'string') return null
    return data
  } catch {
    return null
  }
}
