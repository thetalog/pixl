export function useNav() {
  const { user, myUsername } = useAuth()
  const { count } = useRequests()

  const profilePath = computed(() => {
    const name = myUsername.value || user.value?.userName
    return name ? `/profile/${encodeURIComponent(name)}` : '/settings'
  })

  const sidebar = computed(() => [
    { to: '/', label: 'Feed', icon: 'home' },
    { to: '/explore', label: 'Explore', icon: 'search' },
    { to: '/reels', label: 'Reels', icon: 'reels' },
    { to: '/messages', label: 'Messages', icon: 'message' },
    { to: '/notifications', label: 'Requests', icon: 'heart', badge: count.value },
    { to: '/create', label: 'Create', icon: 'plus' },
    { to: '/live', label: 'Live', icon: 'live' },
    { to: profilePath.value, label: 'Profile', icon: 'user', matchPrefix: '/profile/' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ])

  const tabs = computed(() => [
    { to: '/', label: 'Feed', icon: 'home' },
    { to: '/explore', label: 'Explore', icon: 'search' },
    { to: '/create', label: 'Create', icon: 'plus', emphasize: true },
    { to: '/reels', label: 'Reels', icon: 'reels' },
    { to: profilePath.value, label: 'Profile', icon: 'user', matchPrefix: '/profile/' },
  ])

  return { sidebar, tabs, profilePath }
}
