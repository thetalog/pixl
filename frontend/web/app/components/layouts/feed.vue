<script setup>
const api = usePixlApi()

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
  const idx = storyGroups.value.findIndex((g) => g.userId === item?.userId)
  if (idx >= 0) storyViewerIndex.value = idx
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl gap-8 px-4 py-6">
    <div class="mx-auto w-full max-w-[640px] min-w-0">
      <UiStoriesBar
        :stories="stories"
        :loading="storiesPending"
        :error="storiesError"
        @select="openStoryViewer"
      />

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
          <UiPost v-for="p in posts" :key="p.id" :post="p" />
          <UiEmptyState
            v-if="posts.length === 0"
            title="Follow people to see posts here."
            cta="Explore"
            @action="navigateTo('/explore')"
          />
        </template>
      </div>
    </div>

    <NavAppRightRail />
  </div>
</template>
