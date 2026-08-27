export function useRequests() {
  const api = usePixlApi()
  const toast = useToast()
  const items = useState('incoming-follow-requests', () => [])
  const count = useState('incomingRequestCount', () => 0)
  const loading = useState('incoming-follow-loading', () => false)

  function normalize(res) {
    const raw = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.details)
        ? res.details
        : []
    return raw.filter((row) => row && typeof row === 'object')
  }

  async function refresh() {
    loading.value = true
    try {
      const res = await api.request('/users/get-incoming-follow-request')
      items.value = normalize(res)
      count.value = items.value.length
      return items.value
    } catch (e) {
      items.value = []
      count.value = 0
      return []
    } finally {
      loading.value = false
    }
  }

  async function approveRequest(row) {
    const follow = useFollow()
    const requestId = row?.id
    const requesterUsername = row?.user?.userName || row?.requesterUsername
    if (!requestId || !requesterUsername) {
      toast.error('Missing request details')
      return
    }
    try {
      await follow.approve(requestId, requesterUsername)
      items.value = items.value.filter((r) => r.id !== requestId)
      count.value = items.value.length
      toast.success('Request approved')
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Could not approve'))
    }
  }

  async function rejectRequest(row) {
    const follow = useFollow()
    const requestId = row?.id
    const requesterUsername = row?.user?.userName || row?.requesterUsername
    if (!requestId || !requesterUsername) {
      toast.error('Missing request details')
      return
    }
    try {
      await follow.reject(requestId, requesterUsername)
      items.value = items.value.filter((r) => r.id !== requestId)
      count.value = items.value.length
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Could not reject'))
    }
  }

  return { items, count, loading, refresh, approveRequest, rejectRequest }
}
