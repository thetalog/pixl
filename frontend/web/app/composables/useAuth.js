export const useAuth = () => {
  const user = useState('user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  const login = async ({ email, password }) => {
    const runtimeConfig = useRuntimeConfig()
    const res = await $fetch('/auth/login', {
      method: 'POST',
      baseURL: runtimeConfig.public.apiBase,
      body: { email, password },
    })

    user.value = {
      userName: res?.userName,
    }
    return res
  }

  return { login, user, isLoggedIn }
}