<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = usePixlApi()

const postId = computed(() => route.params.postId?.toString?.() || '')

const { data: response, pending, error } = await useAsyncData(
  () => `single-public-post:${postId.value}`,
  () => api.request('/posts/get-single-public-post', { query: { postId: postId.value } }),
  { server: false, watch: [postId] }
)

const post = computed(() => {
  const value = response.value
  return value?.data || null
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 pb-24">
    <div class="flex items-center gap-3 bg-black px-4 py-3 text-white">
      <button type="button" class="inline-flex items-center" aria-label="Back" @click="navigateTo('/explore')">
        <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
          <path fill="none" stroke="currentColor" stroke-width="2" d="M15 18 9 12l6-6" />
        </svg>
      </button>
      <div class="text-base font-semibold">Post</div>
    </div>

    <div class="mx-auto w-full max-w-md bg-white">
      <div v-if="pending" class="px-3 py-3 text-sm text-gray-700">Loading…</div>
      <div v-else-if="error" class="px-3 py-3 text-sm text-gray-700">Failed to load post.</div>
      <div v-else-if="!post" class="px-3 py-3 text-sm text-gray-700">Post not found.</div>
      <UiPost v-else :post="post" />
    </div>
  </div>
</template>
