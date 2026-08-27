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
    <template v-else>
      <UiPost :post="post" play-video />
      <div class="mt-4 flex gap-2">
        <UiButton
          size="sm"
          variant="ghost"
          @click="navigateTo(`/search?tab=similar&postId=${encodeURIComponent(post.id)}`)"
        >
          Find similar images
        </UiButton>
        <UiButton
          v-if="(post.systemTags || []).length"
          size="sm"
          variant="ghost"
          @click="navigateTo(`/search?tab=ai&q=${encodeURIComponent((post.systemTags || []).slice(0, 3).join(' '))}`)"
        >
          Search related
        </UiButton>
      </div>
    </template>
  </div>
</template>
