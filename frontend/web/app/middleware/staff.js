export default defineNuxtRouteMiddleware(async () => {
  const jwt = useCookie('jwt_token')
  const legacy = useCookie('pixl_token')
  if (!jwt.value && !legacy.value) {
    return navigateTo('/auth/login')
  }

  const { loadMe, isStaff } = useAdmin()
  try {
    await loadMe()
  } catch {
    return navigateTo('/')
  }
  if (!isStaff.value) {
    return navigateTo('/')
  }
})
