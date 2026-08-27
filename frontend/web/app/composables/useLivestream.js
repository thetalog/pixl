import { rewriteLoopbackForLan } from '~/utils/apiBase'

export function useLivestream() {
  const api = usePixlApi()

  async function create({ title, visibility = 'PUBLIC', recordingEnabled = false } = {}) {
    return api.request('/live/start', {
      method: 'POST',
      body: { title, visibility, recordingEnabled },
    })
  }

  async function get(liveId) {
    return api.request(`/live/${encodeURIComponent(liveId)}`)
  }

  async function getByUsername(username) {
    if (!username) return { live: false, stream: null }
    return api.request(`/live/user/${encodeURIComponent(username)}`)
  }

  async function list() {
    const res = await api.request('/live')
    return apiList(res, ['data'])
  }

  async function join(liveId) {
    return api.request(`/live/${encodeURIComponent(liveId)}/join`, { method: 'POST' })
  }

  async function leave(liveId) {
    return api.request(`/live/${encodeURIComponent(liveId)}/leave`, { method: 'POST' })
  }

  async function end(liveId) {
    return api.request(`/live/${encodeURIComponent(liveId)}`, { method: 'DELETE' })
  }

  function isOwnStream(stream, me) {
    if (!stream || !me) return false
    const uid = String(me.id || '')
    const uname = String(me.userName || '').toLowerCase()
    const ownerId = String(stream.userId || stream.user?.id || '')
    const ownerName = String(stream.user?.userName || '').toLowerCase()
    return (uid && ownerId && uid === ownerId) || (uname && ownerName && uname === ownerName)
  }

  function livePath(stream, me) {
    if (!stream?.id) return '/live'
    return `/live/${encodeURIComponent(stream.id)}${isOwnStream(stream, me) ? '?host=1' : ''}`
  }

  function signalingUrl(session) {
    const token = session?.token
    const base = rewriteLoopbackForLan(session?.signalingUrl || useRuntimeConfig().public.liveWsBase)
    if (!base || !token) return ''
    const wsBase = String(base)
      .replace(/^https:\/\//i, 'wss://')
      .replace(/^http:\/\//i, 'ws://')
    const url = new URL(wsBase)
    url.searchParams.set('token', token)
    return url.toString()
  }

  return { create, get, getByUsername, list, join, leave, end, signalingUrl, isOwnStream, livePath }
}
