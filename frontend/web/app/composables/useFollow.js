export function useFollow() {
  const api = usePixlApi()

  async function getStatus(targetUsername) {
    const res = await api.request('/users/get-follow-status', {
      query: { targetUsername },
    })
    const data = res?.data && typeof res.data === 'object' ? res.data : {}
    return {
      isFollow: !!data.isFollow,
      isRequested: !!data.isRequested,
    }
  }

  async function requestFollow(targetUsername) {
    return api.request('/users/follow/request', {
      method: 'POST',
      body: { targetUsername },
    })
  }

  async function approve(requestId, requesterUsername) {
    return api.request('/users/follow/approve', {
      method: 'POST',
      body: { requestId, requesterUsername },
    })
  }

  async function reject(requestId, requesterUsername) {
    return api.request('/users/follow/reject', {
      method: 'POST',
      body: { requestId, requesterUsername },
    })
  }

  async function cancelRequest(targetUsername) {
    return api.request('/users/remove-follow-request', {
      method: 'PATCH',
      query: { targetUsername },
    })
  }

  async function unfollow(targetUsername) {
    return api.request('/users/remove-following', {
      method: 'PATCH',
      query: { targetUsername },
    })
  }

  async function toggleVisibility() {
    return api.request('/users/change-profile-visibility', {
      method: 'PATCH',
    })
  }

  return {
    getStatus,
    requestFollow,
    approve,
    reject,
    cancelRequest,
    unfollow,
    toggleVisibility,
  }
}
