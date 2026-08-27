import { normalizeApiBase, rewriteLoopbackForLan } from '~/utils/apiBase'

const COOKIE_OPTS = { sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 }

function extractJwt(res) {
  if (typeof res?.data === 'string' && res.data.length > 0) return res.data
  if (typeof res?.token === 'string' && res.token.length > 0) return res.token
  if (typeof res?.jwt === 'string' && res.jwt.length > 0) return res.jwt
  if (typeof res?.accessToken === 'string' && res.accessToken.length > 0) return res.accessToken
  return null
}

function extractUserName(res) {
  if (typeof res?.userName === 'string' && res.userName.trim()) return res.userName.trim()
  return ''
}

export const useAuth = () => {
  const api = usePixlApi()
  const runtimeConfig = useRuntimeConfig()
  const apiBase = computed(() => rewriteLoopbackForLan(normalizeApiBase(runtimeConfig.public.apiBase)))
  const jwtTokenCookie = useCookie('jwt_token', COOKIE_OPTS)
  const legacyTokenCookie = useCookie('pixl_token', COOKIE_OPTS)
  const profileUsernameCookie = useCookie('profile_username', COOKIE_OPTS)

  const user = useState('user', () => {
    const cookieName = profileUsernameCookie.value
    return cookieName ? { userName: cookieName } : null
  })

  const token = computed(() => jwtTokenCookie.value || legacyTokenCookie.value)
  const isLoggedIn = computed(() => !!token.value)
  const myUsername = computed(() => String(user.value?.userName || profileUsernameCookie.value || ''))

  function persistSession(res) {
    const jwt = extractJwt(res)
    const userName = extractUserName(res)
    if (jwt) jwtTokenCookie.value = jwt
    if (userName) {
      profileUsernameCookie.value = userName
      user.value = { ...(user.value || {}), userName }
    }
  }

  const login = async ({ email, password }) => {
    const res = await $fetch('/auth/login', {
      method: 'POST',
      baseURL: apiBase.value,
      body: { email, password },
    })
    persistSession(res)
    await fetchMe()
    return res
  }

  const signup = async (payload) => {
    return await $fetch('/auth/signup', {
      method: 'POST',
      baseURL: apiBase.value,
      body: payload,
    })
  }

  const sendOtp = async ({ name, email }) => {
    return await $fetch('/send-otp', {
      method: 'POST',
      baseURL: apiBase.value,
      body: { name, email },
    })
  }

  const verifyOtp = async ({ email, otp }) => {
    return await $fetch('/verify-otp', {
      method: 'POST',
      baseURL: apiBase.value,
      body: { email, otp: Number(otp) },
    })
  }

  const checkUsername = async (userName) => {
    return await api.request('/users/check-username', {
      method: 'POST',
      body: { userName },
      skipAuthRedirect: true,
    })
  }

  const fetchMe = async () => {
    if (!token.value) return null
    try {
      const res = await api.request('/users/profile', { skipAuthRedirect: true })
      const details = res?.details || null
      if (details && typeof details === 'object') {
        user.value = details
        if (typeof details.userName === 'string' && details.userName) {
          profileUsernameCookie.value = details.userName
        }
      }
      return details
    } catch {
      return user.value
    }
  }

  const logout = async () => {
    jwtTokenCookie.value = null
    legacyTokenCookie.value = null
    profileUsernameCookie.value = null
    user.value = null
    await navigateTo('/auth/login')
  }

  return {
    login,
    signup,
    sendOtp,
    verifyOtp,
    checkUsername,
    fetchMe,
    logout,
    user,
    isLoggedIn,
    token,
    myUsername,
  }
}
