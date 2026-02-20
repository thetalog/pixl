export const useAuth = () => {
  const profileUsernameCookie = useCookie('profile_username', { sameSite: 'lax', path: '/' })
  const user = useState('user', () => {
    const cookieName = profileUsernameCookie.value
    return cookieName ? { userName: cookieName } : null
  })
  const isLoggedIn = computed(() => !!user.value)

  const login = async ({ email, password }) => {
    const runtimeConfig = useRuntimeConfig()
    const res = await $fetch('/auth/login', {
      method: 'POST',
      baseURL: runtimeConfig.public.apiBase,
      body: { email, password },
    })

    const userName = res?.userName || res?.data?.userName || res?.data?.data?.userName
    if (typeof userName === 'string' && userName.trim()) {
      profileUsernameCookie.value = userName.trim()
      user.value = { userName: userName.trim() }
    } else {
      user.value = user.value || null
    }
    return res
  }

  return { login, user, isLoggedIn }
}