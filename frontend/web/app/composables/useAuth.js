export const useAuth = () => {
  const user = useState('user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  const login = async ({ email, password }) => {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })

    user.value = res.user
    return res
  }

  return { login, user, isLoggedIn }
}