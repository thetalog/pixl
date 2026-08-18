export function useChrome() {
  const route = useRoute()
  const storyOpen = useState('story-viewer-open', () => false)

  const hideBottomNav = computed(() => {
    if (storyOpen.value) return true
    if (route.meta?.hideBottomNav) return true
    const p = route.path
    return (
      p.startsWith('/messages/direct/') ||
      p.startsWith('/messages/group/') ||
      p.startsWith('/live/') ||
      p === '/create'
    )
  })

  const hideHeader = computed(() => {
    if (storyOpen.value) return true
    return !!route.meta?.hideHeader
  })

  return { hideBottomNav, hideHeader, storyOpen }
}
