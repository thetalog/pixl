import { normalizeApiBase } from '~/utils/apiBase'

const COOKIE_OPTS = { sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 }

export function usePixlApi() {
  const runtimeConfig = useRuntimeConfig()
  const apiBase = normalizeApiBase(runtimeConfig.public.apiBase)
  const jwtTokenCookie = useCookie('jwt_token', COOKIE_OPTS)
  const legacyTokenCookie = useCookie('pixl_token', COOKIE_OPTS)
  const profileUsernameCookie = useCookie('profile_username', COOKIE_OPTS)

  const token = computed(() => jwtTokenCookie.value || legacyTokenCookie.value)

  function clearSession() {
    jwtTokenCookie.value = null
    legacyTokenCookie.value = null
    profileUsernameCookie.value = null
    const user = useState('user', () => null)
    user.value = null
  }

  const request = async (path, options = {}) => {
    const { skipAuthRedirect, ...fetchOptions } = options
    const headers = {
      ...(fetchOptions.headers || {}),
    }

    if (token.value && !headers.Authorization) {
      headers.Authorization = `Bearer ${token.value}`
    }

    try {
      return await $fetch(path, {
        baseURL: apiBase,
        ...fetchOptions,
        headers,
      })
    } catch (error) {
      const status = error?.statusCode || error?.status
      const routePath = import.meta.client ? window.location?.pathname || '' : ''
      const onAuthPage = routePath.startsWith('/auth')

      if (status === 401 && !skipAuthRedirect && !onAuthPage && import.meta.client) {
        clearSession()
        await navigateTo('/auth/login')
      }

      throw error
    }
  }

  return {
    request,
    token,
    clearSession,
  }
}
