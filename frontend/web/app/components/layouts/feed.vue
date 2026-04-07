<script setup>
const api = usePixlApi()

const { data: response, pending, error } = await useAsyncData(
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
        const userName = user.userName || first.userName || ''
        const profilePic = user.profilePic || first.profilePic || ''
        const isSeen = userStories.every((s) => !!s?.isSeen)

        out.push({
            userId,
            userName,
            profilePic,
            isSeen,
            stories: userStories,
        })
    }

    return out
})

const storyViewerIndex = ref(null)

const previousBodyOverflow = ref(null)

watch(storyViewerIndex, (value) => {
    if (!process.client) return

    if (value !== null) {
        if (previousBodyOverflow.value === null) {
            previousBodyOverflow.value = document.body.style.overflow
        }
        document.body.style.overflow = 'hidden'
        return
    }

    if (previousBodyOverflow.value !== null) {
        document.body.style.overflow = previousBodyOverflow.value
        previousBodyOverflow.value = null
    }
})

onBeforeUnmount(() => {
    if (!process.client) return
    if (previousBodyOverflow.value !== null) {
        document.body.style.overflow = previousBodyOverflow.value
        previousBodyOverflow.value = null
    }
})

function openStoryViewer(item) {
    const idx = storyGroups.value.findIndex((g) => g.userId === item?.userId)
    if (idx >= 0) storyViewerIndex.value = idx
}
</script>

<template>
    <div class="bg-gray-100 min-w-0 flex flex-col justify-center max-w-md">
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
        <div class="mx-auto w-full max-w-md bg-white min-w-0">
            <div v-if="pending" class="px-3 py-3 text-sm text-gray-700">Loading…</div>
            <div v-else-if="error" class="px-3 py-3 text-sm text-gray-700">
                Failed to load feed.
            </div>
            <div v-else>
                <UiPost v-for="p in posts" :key="p.id" :post="p" />
                <div v-if="posts.length === 0" class="px-3 py-6 text-sm text-gray-700">
                    No posts yet.
                </div>
                <div class="h-24 bg-transparent text-center text-sm text-gray-700 pt-2">
                    No other posts available!
                </div>
                     <!-- padding for bottom nav -->
            </div>
        </div>
    </div>
</template>
