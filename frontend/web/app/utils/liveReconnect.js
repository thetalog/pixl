export const CONNECTION = {
  CONNECTED: 'CONNECTED',
  CONNECTION_LOST: 'CONNECTION_LOST',
  RECONNECTING: 'RECONNECTING',
}

export function nextBackoffMs(attempt, { base = 500, max = 8000 } = {}) {
  const n = Math.max(0, Number(attempt) || 0)
  const exp = Math.min(max, base * 2 ** n)
  const jitter = Math.floor(Math.random() * 200)
  return exp + jitter
}
