<script setup>
definePageMeta({ middleware: 'auth' })

const api = usePixlApi()

const categories = ['All', 'IGTV', 'SHOP', 'STYLE', 'SPORTS', 'AUTO', 'MUSIC', 'MOVIES']
const selectedCategory = ref('All')
const cache = reactive({})
const loading = ref(false)
const error = ref('')

async function fetchCategory(category) {
  if (cache[category]) return
  loading.value = true
  error.value = ''
  try {
    const res =
      category === 'All'
        ? await api.request('/posts/get-all-public-posts')
        : await api.request('/posts/get-all-public-posts-by-ui-category', {
            query: { category },
          })
    cache[category] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
  } catch (e) {
    error.value = apiErrorMessage(e, 'Failed to load explore posts.')
    cache[category] = []
  } finally {
    loading.value = false
  }
}

const posts = computed(() => cache[selectedCategory.value] || [])

onMounted(() => fetchCategory(selectedCategory.value))
watch(selectedCategory, (cat) => fetchCategory(cat))
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-6">
    <button
      type="button"
      class="flex w-full max-w-xl items-center gap-3 rounded-full border border-white/8 bg-pixl-elevated px-4 py-3 text-left text-pixl-tertiary"
      @click="navigateTo('/search')"
    >
      <UiIcon name="search" :size="20" />
      Search username…
    </button>

    <div class="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        class="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition duration-200"
        :class="c === selectedCategory ? 'bg-pixl-accent text-white' : 'bg-white/8 text-pixl-muted hover:text-pixl-text'"
        @click="selectedCategory = c"
      >
        {{ c }}
      </button>
    </div>

    <div class="mt-4">
      <div v-if="loading && posts.length === 0" class="columns-2 gap-2 sm:columns-3 lg:columns-4">
        <UiSkeleton v-for="n in 8" :key="n" class="mb-2" height="180px" rounded="rounded-card" />
      </div>
      <UiEmptyState v-else-if="error" :title="error" />
      <UiEmptyState v-else-if="posts.length === 0" title="No posts in this category." />
      <div v-else class="columns-2 gap-2 sm:columns-3 lg:columns-4">
        <button
          v-for="p in posts"
          :key="p.id"
          type="button"
          class="mb-2 block w-full break-inside-avoid overflow-hidden rounded-card"
          aria-label="Open post"
          @click="navigateTo(`/posts/${p.id}`)"
        >
          <img
            v-if="extractPreviewUrl(p)"
            :src="extractPreviewUrl(p)"
            alt=""
            class="w-full bg-pixl-elevated object-cover"
            loading="lazy"
            referrerpolicy="no-referrer"
            @error="($event) => { $event.target.style.display = 'none' }"
          />
        </button>
      </div>
    </div>
  </div>
</template>
