export function useNotifications() {
  const api = usePixlApi()
  const items = useState('user-notifications', () => [])
  const unreadCount = useState('user-notifications-unread', () => 0)
  const loading = useState('user-notifications-loading', () => false)

  async function refresh() {
    loading.value = true
    try {
      const res = await api.request('/users/notifications', { query: { take: '50' } })
      items.value = Array.isArray(res?.data) ? res.data : []
      unreadCount.value = Number(res?.unreadCount) || items.value.filter((n) => !n.read).length
      return items.value
    } catch {
      items.value = []
      unreadCount.value = 0
      return []
    } finally {
      loading.value = false
    }
  }

  async function markRead(ids) {
    try {
      await api.request('/users/notifications/read', {
        method: 'PATCH',
        body: ids?.length ? { ids } : {},
      })
      if (ids?.length) {
        const set = new Set(ids)
        items.value = items.value.map((n) => (set.has(n.id) ? { ...n, read: true } : n))
      } else {
        items.value = items.value.map((n) => ({ ...n, read: true }))
      }
      unreadCount.value = items.value.filter((n) => !n.read).length
    } catch {
      // ignore — badge will refresh next visit
    }
  }

  return { items, unreadCount, loading, refresh, markRead }
}
