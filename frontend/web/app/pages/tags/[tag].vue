<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = usePixlApi()
const tag = computed(() => decodeURIComponent(route.params.tag?.toString?.() || '').replace(/^#/, ''))

const { data: response, pending, error, refresh } = await useAsyncData(
  () => `posts-by-tag:${tag.value}`,
  () => api.request('/posts/by-tag', { query: { tag: tag.value } }),
  { server: false, watch: [tag] }
)

const posts = computed(() => (Array.isArray(response.value?.data) ? response.value.data : []))
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-6">
    <h1 class="text-2xl font-semibold tracking-tight">#{{ tag }}</h1>
    <p class="mt-1 text-sm text-pixl-muted">{{ posts.length }} post{{ posts.length === 1 ? '' : 's' }}</p>

    <div class="mt-6">
      <div v-if="pending" class="grid grid-cols-3 gap-1">
        <UiSkeleton v-for="n in 9" :key="n" class="aspect-square" rounded="rounded-none" />
      </div>
      <UiEmptyState v-else-if="error" title="Couldn’t load this tag." cta="Retry" @action="refresh" />
      <UiEmptyState v-else-if="posts.length === 0" title="No posts with this tag yet." />
      <div v-else class="grid grid-cols-3 gap-1">
        <button
          v-for="p in posts"
          :key="p.id"
          type="button"
          class="relative aspect-square overflow-hidden bg-pixl-elevated"
          aria-label="Open post"
          @click="navigateTo(`/posts/${p.id}`)"
        >
          <img
            v-if="extractPreviewUrl(p)"
            :src="extractPreviewUrl(p)"
            alt=""
            class="h-full w-full object-cover"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <span v-else class="grid h-full w-full place-items-center text-pixl-muted">
            <UiIcon name="image" :size="22" />
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
