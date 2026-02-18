export default defineNuxtRouteMiddleware(() => {
    const token = useCookie('pixl_token')
    if (!token.value) {
        return navigateTo('/auth/login')
    }
})
