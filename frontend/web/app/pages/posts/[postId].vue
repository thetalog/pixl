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

const post = computed(() => response.value?.data || null)
</script>

<template>
  <div class="mx-auto w-full max-w-[640px] px-4 py-6">
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-2 text-sm text-pixl-muted hover:text-pixl-text"
      aria-label="Back"
      @click="navigateTo('/explore')"
    >
      <UiIcon name="back" :size="18" />
      Back
    </button>
    <UiSkeleton v-if="pending" height="520px" rounded="rounded-card" />
    <UiEmptyState v-else-if="error || !post" title="Post not found." />
    <UiPost v-else :post="post" play-video />
  </div>
</template>
