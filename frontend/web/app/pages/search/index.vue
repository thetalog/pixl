<script setup>
definePageMeta({ middleware: 'auth' })

const api = usePixlApi()
const query = ref('')
const results = ref([])
const loading = ref(false)
let timer = null

async function performSearch() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const res = await api.request('/users/search/all', { query: { username: q } })
    results.value = Array.isArray(res) ? res : []
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

watch(query, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => performSearch(), 400)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="mx-auto w-full max-w-lg px-4 py-6">
    <div class="flex items-center gap-3">
      <button type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/6" aria-label="Back" @click="navigateTo('/explore')">
        <UiIcon name="back" :size="20" />
      </button>
      <input
        v-model="query"
        type="text"
        autofocus
        placeholder="Search username…"
        class="h-10 w-full rounded-full border border-white/8 bg-pixl-elevated px-4 text-sm text-pixl-text placeholder:text-pixl-tertiary focus:border-pixl-accent/60 focus:ring-2 focus:ring-pixl-accent/40"
      />
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <UiSkeleton v-for="n in 5" :key="n" height="56px" rounded="rounded-card" />
    </div>
    <UiEmptyState v-else-if="results.length === 0" :title="query.trim() ? 'No users found.' : 'Search for people on Pixl.'" />
    <div v-else class="mt-4 divide-y divide-white/6">
      <button
        v-for="u in results"
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
  </div>
</template>
