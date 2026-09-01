export function useAdmin() {
  const api = usePixlApi()
  const toast = useToast()
  const { user, fetchMe } = useAuth()

  const me = useState('admin-me', () => null)
  const loadingMe = useState('admin-me-loading', () => false)

  const capabilities = computed(() => me.value?.capabilities || user.value?.capabilities || null)
  const can = (permission) => {
    const caps = capabilities.value
    if (!caps) return false
    if (caps.roleKey === 'SUPER_ADMIN') return true
    if (caps.can && caps.can[permission]) return true
    return Array.isArray(caps.permissions) && caps.permissions.includes(permission)
  }
  const canAny = (...perms) => perms.some((p) => can(p))
  const isStaff = computed(() => Boolean(capabilities.value?.isStaff || (user.value?.roleKey && user.value.roleKey !== 'USER')))

  async function loadMe() {
    loadingMe.value = true
    try {
      const res = await api.request('/admin/me')
      me.value = res?.data || res
      return me.value
    } catch (error) {
      me.value = null
      throw error
    } finally {
      loadingMe.value = false
    }
  }

  async function get(path, query) {
    const res = await api.request(path, { query })
    return res?.data !== undefined ? res.data : res
  }

  async function post(path, body) {
    const res = await api.request(path, { method: 'POST', body })
    return res?.data !== undefined ? res.data : res
  }

  async function act(path, body, { success = 'Done', error: errorMsg = 'Action failed' } = {}) {
    try {
      const data = await post(path, body)
      toast.success(success)
      return data
    } catch (error) {
      const message = error?.data?.message || error?.message || errorMsg
      toast.error(message)
      throw error
    }
  }

  async function persistToken(payload) {
    const jwtTokenCookie = useCookie('jwt_token', { sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
    const profileUsernameCookie = useCookie('profile_username', { sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
    if (payload?.token) jwtTokenCookie.value = payload.token
    if (payload?.userName) {
      profileUsernameCookie.value = payload.userName
      user.value = { ...(user.value || {}), userName: payload.userName }
    }
    me.value = null
    await fetchMe()
  }

  return {
    me,
    loadingMe,
    capabilities,
    can,
    canAny,
    isStaff,
    loadMe,
    get,
    post,
    act,
    persistToken,
  }
}
