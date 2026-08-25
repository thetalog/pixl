<script setup>
definePageMeta({ middleware: 'auth' })

const api = usePixlApi()
const toast = useToast()
const route = useRoute()

const tabs = [
  { id: 'people', label: 'People' },
  { id: 'ai', label: 'AI images' },
  { id: 'similar', label: 'Similar' },
]

const mode = ref(['people', 'ai', 'similar'].includes(String(route.query.tab)) ? String(route.query.tab) : 'people')
const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
const people = ref([])
const images = ref([])
const similar = ref([])
const similarLabels = ref([])
const loading = ref(false)
const similarInput = ref(null)
let timer = null

watch(mode, (tab) => {
  navigateTo({ query: { ...route.query, tab } }, { replace: true })
  if (tab === 'ai' && query.value.trim()) runAiSearch()
  if (tab === 'people' && query.value.trim()) runPeopleSearch()
})

async function runPeopleSearch() {
  const q = query.value.trim()
  if (!q) {
    people.value = []
    return
  }
  loading.value = true
  try {
    const res = await api.request('/users/search/all', { query: { username: q } })
    people.value = Array.isArray(res) ? res : []
  } catch {
    people.value = []
  } finally {
    loading.value = false
  }
}

async function runAiSearch() {
  const q = query.value.trim()
  if (!q) {
    images.value = []
    return
  }
  loading.value = true
  try {
    const res = await api.request('/posts/ai-search', { query: { q, take: '24' } })
    images.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    images.value = []
    toast.error(apiErrorMessage(e, 'Image search failed'))
  } finally {
    loading.value = false
  }
}

async function runSimilarFromPost(postId) {
  if (!postId) return
  loading.value = true
  try {
    const res = await api.request('/posts/similar', { query: { postId, take: '24' } })
    similar.value = Array.isArray(res?.data) ? res.data : []
    similarLabels.value = Array.isArray(res?.labels) ? res.labels : []
  } catch (e) {
    similar.value = []
    toast.error(apiErrorMessage(e, 'Similar search failed'))
  } finally {
    loading.value = false
  }
}

async function runSimilarFromFile(file) {
  if (!file) return
  loading.value = true
  try {
    const form = new FormData()
    const [ready] = await prepareUploadFiles([file])
    form.append('file', ready || file)
    const res = await api.request('/posts/similar', { method: 'POST', body: form })
    similar.value = Array.isArray(res?.data) ? res.data : []
    similarLabels.value = Array.isArray(res?.labels) ? res.labels : []
  } catch (e) {
    similar.value = []
    toast.error(apiErrorMessage(e, 'Similar search failed'))
  } finally {
    loading.value = false
  }
}

function onQueryInput() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    if (mode.value === 'people') runPeopleSearch()
    else if (mode.value === 'ai') runAiSearch()
  }, 400)
}

watch(query, onQueryInput)

onMounted(() => {
  if (route.query.postId) {
    mode.value = 'similar'
    runSimilarFromPost(String(route.query.postId))
  } else if (query.value.trim()) {
    if (mode.value === 'ai') runAiSearch()
    else runPeopleSearch()
  }
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-6">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/6"
        aria-label="Back"
        @click="navigateTo('/explore')"
      >
        <UiIcon name="back" :size="20" />
      </button>
      <input
        v-if="mode !== 'similar'"
        v-model="query"
        type="text"
        autofocus
        :placeholder="mode === 'ai' ? 'Try “sunset beach” or “city night”…' : 'Search username…'"
        class="h-10 w-full rounded-full border border-white/8 bg-pixl-elevated px-4 text-sm text-pixl-text placeholder:text-pixl-tertiary focus:border-pixl-accent/60 focus:ring-2 focus:ring-pixl-accent/40"
      />
      <div v-else class="flex h-10 w-full items-center justify-between gap-2 rounded-full border border-white/8 bg-pixl-elevated px-4 text-sm text-pixl-muted">
        <span>Upload a photo or open Similar from a post</span>
        <button type="button" class="font-semibold text-pixl-accent" @click="similarInput?.click()">Browse</button>
        <input
          ref="similarInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="runSimilarFromFile($event.target.files?.[0]); $event.target.value = ''"
        />
      </div>
    </div>

    <div class="mt-4 flex gap-2">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        class="rounded-full px-4 py-1.5 text-sm font-semibold"
        :class="mode === t.id ? 'bg-pixl-accent text-white' : 'bg-white/8 text-pixl-muted'"
        @click="mode = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <UiSkeleton v-for="n in 6" :key="n" height="56px" rounded="rounded-card" />
    </div>

    <template v-else-if="mode === 'people'">
      <UiEmptyState
        v-if="people.length === 0"
        :title="query.trim() ? 'No users found.' : 'Search for people on Pixl.'"
      />
      <div v-else class="mt-4 divide-y divide-white/6">
        <button
          v-for="u in people"
          :key="u.id || u.userName"
          type="button"
          class="flex w-full items-center gap-3 py-3 text-left hover:bg-white/4"
          @click="navigateTo(`/profile/${u.userName}`)"
        >
          <UiAvatar :src="u.profilePic" :alt="u.userName" :size="40" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-semibold">{{ u.userName }}</div>
            <div class="truncate text-xs text-pixl-muted">{{ u.name || u.email || '' }}</div>
          </div>
        </button>
      </div>
    </template>

    <template v-else-if="mode === 'ai'">
      <UiEmptyState
        v-if="images.length === 0"
        :title="query.trim() ? 'No matching images.' : 'Describe a scene — powered by Rekognition labels.'"
      />
      <div v-else class="mt-4 columns-2 gap-2 sm:columns-3">
        <button
          v-for="p in images"
          :key="p.id"
          type="button"
          class="mb-2 block w-full break-inside-avoid overflow-hidden rounded-card"
          @click="navigateTo(`/posts/${p.id}`)"
        >
          <img v-if="extractPreviewUrl(p)" :src="extractPreviewUrl(p)" alt="" class="w-full object-cover" loading="lazy" />
        </button>
      </div>
    </template>

    <template v-else>
      <p v-if="similarLabels.length" class="mt-4 text-xs text-pixl-tertiary">
        Matched labels: {{ similarLabels.slice(0, 12).join(', ') }}
      </p>
      <UiEmptyState
        v-if="similar.length === 0"
        title="Upload an image to find visually similar posts."
        cta="Choose image"
        @action="similarInput?.click()"
      />
      <div v-else class="mt-4 columns-2 gap-2 sm:columns-3">
        <button
          v-for="p in similar"
          :key="p.id"
          type="button"
          class="mb-2 block w-full break-inside-avoid overflow-hidden rounded-card"
          @click="navigateTo(`/posts/${p.id}`)"
        >
          <img v-if="extractPreviewUrl(p)" :src="extractPreviewUrl(p)" alt="" class="w-full object-cover" loading="lazy" />
          <span v-if="p._similarity" class="mt-1 block text-[10px] text-pixl-tertiary">
            {{ Math.round(p._similarity * 100) }}% match
          </span>
        </button>
      </div>
    </template>
  </div>
</template>
