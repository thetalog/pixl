export function usePixlApi() {
  const runtimeConfig = useRuntimeConfig()
  const jwtTokenCookie = useCookie('jwt_token', { sameSite: 'lax' })
  const legacyTokenCookie = useCookie('pixl_token', { sameSite: 'lax' })

  const token = computed(() => jwtTokenCookie.value || legacyTokenCookie.value)

  const request = async (path, options = {}) => {
    const headers = {
      ...(options.headers || {}),
    }

    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }

    return await $fetch(path, {
      baseURL: runtimeConfig.public.apiBase,
      ...options,
      headers,
    })
  }

  return {
    request,
  }
}
