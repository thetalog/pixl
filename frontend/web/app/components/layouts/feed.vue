<script setup>
const api = usePixlApi()
const { user, myUsername } = useAuth()

const { data: response, pending, error, refresh } = await useAsyncData(
  'followed-posts',
  () => api.request('/posts/get-followed-posts'),
  { server: false }
)

const {
  data: storiesResponse,
  pending: storiesPending,
  error: storiesError,
} = await useAsyncData(
  'followed-stories',
  () => api.request('/posts/get-all-followed-stories'),
  { server: false }
)

const { data: livesResponse } = await useAsyncData(
  'followed-lives',
  () => api.request('/live'),
  { server: false }
)

const { data: suggestedUsersResponse } = await useAsyncData(
  'suggested-users',
  () => api.request('/users/suggested', { query: { take: '10' } }),
  { server: false }
)

const { data: suggestedPostsResponse } = await useAsyncData(
  'suggested-posts',
  () => api.request('/posts/suggested', { query: { take: '12' } }),
  { server: false }
)

const posts = computed(() => {
  const value = response.value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value)) return value
  return []
})

const stories = computed(() => {
  const value = storiesResponse.value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value)) return value
  return []
})

const lives = computed(() => apiList(livesResponse.value, ['data']))

const suggestedUsers = computed(() => {
  const value = suggestedUsersResponse.value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value)) return value
  return []
})

const suggestedPosts = computed(() => {
  const value = suggestedPostsResponse.value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value)) return value
  return []
})

const feedItems = computed(() => {
  const followed = posts.value.map((post) => ({ type: 'post', post }))
  const suggested = suggestedPosts.value.map((post) => ({ type: 'suggested', post }))
  if (!suggested.length) return followed

  const out = []
  let suggestedIndex = 0
  followed.forEach((item, index) => {
    out.push(item)
    if ((index + 1) % 3 === 0 && suggestedIndex < suggested.length) {
      out.push(suggested[suggestedIndex])
      suggestedIndex += 1
    }
  })
  while (suggestedIndex < suggested.length) {
    out.push(suggested[suggestedIndex])
    suggestedIndex += 1
  }
  return out
})

const storyGroups = computed(() => {
  const list = stories.value
  const grouped = new Map()
  for (const story of list) {
    const user = story?.user
    const userId = (user?.id ?? story?.userId)?.toString?.() || user?.id || story?.userId
    if (!userId) continue
    const bucket = grouped.get(userId) || []
    bucket.push(story)
    grouped.set(userId, bucket)
  }
  const out = []
  for (const [userId, userStories] of grouped.entries()) {
    const first = userStories[0] || {}
    const user = first.user || {}
    out.push({
      userId,
      userName: user.userName || first.userName || '',
      profilePic: user.profilePic || first.profilePic || '',
      isSeen: userStories.every((s) => !!s?.isSeen),
      stories: userStories,
    })
  }
  return out
})

const storyViewerIndex = ref(null)

function openStoryViewer(item) {
  if (item?.liveId) {
    const mine = String(item.userName || '').toLowerCase() === String(myUsername.value || '').toLowerCase()
      || String(item.userId || '') === String(user.value?.id || '')
    navigateTo(`/live/${encodeURIComponent(item.liveId)}${mine ? '?host=1' : ''}`)
    return
  }
  const idx = storyGroups.value.findIndex((g) => g.userId === item?.userId)
  if (idx >= 0) storyViewerIndex.value = idx
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl gap-8 px-4 py-6">
    <div class="mx-auto w-full max-w-[640px] min-w-0">
      <UiStoriesBar
        :stories="stories"
        :lives="lives"
        :loading="storiesPending"
        :error="storiesError"
        @select="openStoryViewer"
      />

      <UiSuggestedUsersBar :users="suggestedUsers" />

      <UiStoryViewer
        v-if="storyViewerIndex !== null"
        :groups="storyGroups"
        :index="storyViewerIndex"
        @close="storyViewerIndex = null"
        @update:index="storyViewerIndex = $event"
      />

      <div class="mt-4 space-y-4">
        <div v-if="pending" class="space-y-4">
          <UiSkeleton v-for="n in 3" :key="n" height="420px" rounded="rounded-card" />
        </div>
        <UiEmptyState
          v-else-if="error"
          title="Couldn’t load your feed. Try again."
          cta="Retry"
          @action="refresh"
        />
        <template v-else>
          <UiPost
            v-for="item in feedItems"
            :key="item.type === 'suggested' ? `suggested-${item.post.id}` : item.post.id"
            :post="item.post"
            :show-follow-button="item.type === 'suggested'"
            :suggested="item.type === 'suggested'"
            :topic="item.post?.topic"
          />
          <UiEmptyState
            v-if="feedItems.length === 0"
            title="No posts yet. Create one or follow people to fill your feed."
            cta="Create"
            @action="navigateTo('/create')"
          />
        </template>
      </div>
    </div>

    <NavAppRightRail />
  </div>
</template>
