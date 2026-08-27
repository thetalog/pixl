export default defineNuxtPlugin(async () => {
  const { fetchMe, isLoggedIn } = useAuth()
  const { refresh } = useRequests()

  if (!isLoggedIn.value) return

  await fetchMe()
  refresh().catch(() => {})
})
