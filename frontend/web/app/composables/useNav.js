export function useNav() {
  const { user, myUsername } = useAuth()
  const { count } = useRequests()
  const { unreadCount } = useNotifications()
  const isStaff = computed(() => {
    const key = user.value?.roleKey
    return Boolean(user.value?.capabilities?.isStaff || (key && key !== 'USER'))
  })

  const profilePath = computed(() => {
    const name = myUsername.value || user.value?.userName
    return name ? `/profile/${encodeURIComponent(name)}` : '/explore'
  })

  const activityBadge = computed(
    () => Number(count.value || 0) + Number(unreadCount.value || 0)
  )

  const sidebar = computed(() => [
    { to: '/', label: 'Feed', icon: 'home' },
    { to: '/explore', label: 'Explore', icon: 'search' },
    { to: '/reels', label: 'Reels', icon: 'reels' },
    { to: '/messages', label: 'Messages', icon: 'message' },
    { to: '/notifications', label: 'Activity', icon: 'heart', badge: activityBadge.value },
    { to: '/create', label: 'Create', icon: 'plus' },
    { to: '/live', label: 'Live', icon: 'live' },
    { to: profilePath.value, label: 'Profile', icon: 'user', matchPrefix: '/profile/' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
    ...(isStaff.value ? [{ to: '/admin', label: 'Console', icon: 'shield' }] : []),
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
