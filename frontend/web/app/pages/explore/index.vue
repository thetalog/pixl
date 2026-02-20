<script setup>
definePageMeta({ middleware: 'auth' })

const api = usePixlApi()

const categories = [
  'All',
  'IGTV',
  'Shop',
  'Style',
  'Sports',
  'Auto',
  'Music',
  'Movies',
]

const selectedCategory = ref('All')

const cache = reactive({})
const loading = ref(false)
const error = ref('')

function firstString(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0]
  return null
}

function normalizeUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `http://${url}`
}

function extractPreviewUrl(post) {
  const mediaValue = post?.media
  if (!Array.isArray(mediaValue) || mediaValue.length === 0) return ''

  const media0 = mediaValue[0]
  if (!media0 || typeof media0 !== 'object') return ''

  const mimeType = media0.mimeType
  const candidate =
    mimeType === 'VIDEO' ? (media0.thumbnail ?? media0.url) : (media0.url ?? media0.thumbnail)

  const url = firstString(candidate)
  return normalizeUrl(url)
}

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

    const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    cache[category] = list
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Failed to load explore posts.'
    cache[category] = []
  } finally {
    loading.value = false
  }
}

const posts = computed(() => cache[selectedCategory.value] || [])

function openSearch() {
  navigateTo('/search')
}

function openPost(post) {
  const id = post?.id
  if (!id) return
  navigateTo(`/posts/${id}`)
}

onMounted(() => {
  fetchCategory(selectedCategory.value)
})

watch(selectedCategory, (cat) => {
  fetchCategory(cat)
})
</script>

<template>
  <div class="min-h-screen bg-white pb-24">
    <!-- Top bar (matches Flutter home header) -->
    <div class="flex items-center justify-between bg-black px-4 py-3 text-white">
      <div class="text-2xl font-semibold italic">Pixl</div>
      <button type="button" class="inline-flex items-center" aria-label="Create">
        <svg viewBox="0 0 24 24" class="h-7 w-7" aria-hidden="true">
          <path fill="currentColor" d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
        </svg>
      </button>
    </div>

    <!-- Search (tap navigates to /search like Flutter) -->
    <div class="px-4 pt-4">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-2xl bg-gray-100 px-4 py-3"
        @click="openSearch"
      >
        <svg viewBox="0 0 24 24" class="h-6 w-6 text-gray-400" aria-hidden="true">
          <path
            fill="currentColor"
            d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
          />
        </svg>
        <div class="text-base text-gray-400">Search username...</div>
      </button>
    </div>

    <!-- Categories -->
    <div class="border-b border-gray-200">
      <div class="flex gap-8 overflow-x-auto px-4 pt-4 text-lg">
        <button
          v-for="c in categories"
          :key="c"
          type="button"
          class="whitespace-nowrap pb-3"
          :class="c === selectedCategory ? 'border-b-2 border-black font-semibold text-black' : 'text-gray-400'"
          @click="selectedCategory = c"
        >
          {{ c }}
        </button>
      </div>
    </div>

    <!-- Grid -->
    <div class="px-2 pt-2">
      <div v-if="loading && posts.length === 0" class="py-8 text-center text-sm text-gray-600">
        Loading…
      </div>
      <div v-else-if="error" class="py-8 text-center text-sm text-gray-600">
        {{ error }}
      </div>
      <div v-else-if="posts.length === 0" class="py-8 text-center text-sm text-gray-600">
        No Post available
      </div>
      <div v-else class="columns-3 gap-1">
        <button
          v-for="p in posts"
          :key="p.id"
          type="button"
          class="mb-1 block w-full break-inside-avoid"
          aria-label="Open post"
          @click="openPost(p)"
        >
          <img
            :src="extractPreviewUrl(p)"
            alt=""
            class="w-full rounded-2xl bg-gray-100 object-cover"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </button>
      </div>
    </div>
  </div>
</template>
