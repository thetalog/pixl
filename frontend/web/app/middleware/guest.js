export default defineNuxtRouteMiddleware(() => {
  const jwt = useCookie('jwt_token')
  const legacy = useCookie('pixl_token')

  if (jwt.value || legacy.value) {
    return navigateTo('/')
  }
})
