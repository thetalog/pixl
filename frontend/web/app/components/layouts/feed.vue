<script setup>
const api = usePixlApi()

const { data: response, pending, error } = await useAsyncData(
    'followed-posts',
    () => api.request('/posts/get-followed-posts'),
    { server: false }
)

const posts = computed(() => {
    const value = response.value
    if (Array.isArray(value?.data)) return value.data
    if (Array.isArray(value)) return value
    return []
})
</script>

<template>
    <div class="min-h-screen bg-gray-100">
        <div class="mx-auto w-full max-w-md bg-white">
            <div v-if="pending" class="px-3 py-3 text-sm text-gray-700">Loading…</div>
            <div v-else-if="error" class="px-3 py-3 text-sm text-gray-700">
                Failed to load feed.
            </div>
            <div v-else>
                <UiPost v-for="p in posts" :key="p.id" :post="p" />
                <div v-if="posts.length === 0" class="px-3 py-6 text-sm text-gray-700">
                    No posts yet.
                </div>
            </div>
        </div>
    </div>
</template>
