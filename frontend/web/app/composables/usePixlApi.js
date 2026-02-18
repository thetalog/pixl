export function usePixlApi() {
  const runtimeConfig = useRuntimeConfig()
  const tokenCookie = useCookie('pixl_token', { sameSite: 'lax' })

  const request = async (path, options = {}) => {
    const headers = {
      ...(options.headers || {}),
    }

    if (tokenCookie.value) {
      headers.Authorization = `Bearer ${tokenCookie.value}`
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
