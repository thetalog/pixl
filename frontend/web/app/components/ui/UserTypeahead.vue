<template>
  <div class="relative">
    <input
      v-model="query"
      type="text"
      :placeholder="placeholder"
      class="h-10 w-full rounded-control border border-white/8 bg-pixl-elevated px-3 text-sm text-pixl-text placeholder:text-pixl-tertiary focus:border-pixl-accent/60 focus:ring-2 focus:ring-pixl-accent/40"
      @focus="open = true"
    />
    <div
      v-if="open && query.trim()"
      class="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-card border border-white/8 bg-pixl-elevated shadow-pixl"
    >
      <div v-if="loading" class="px-3 py-2 text-sm text-pixl-muted">Searching…</div>
      <button
        v-for="u in results"
        :key="u.id || u.userName"
        type="button"
        class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/6"
        @click="pick(u)"
      >
        <UiAvatar :src="u.profilePic" :alt="u.userName" :size="32" />
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium">{{ u.name || u.userName }}</span>
          <span class="block truncate text-xs text-pixl-tertiary">@{{ u.userName }}</span>
        </span>
      </button>
      <div v-if="!loading && results.length === 0" class="px-3 py-2 text-sm text-pixl-muted">
        No users found
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['select'])
defineProps({
  placeholder: { type: String, default: 'Search username' },
})

const api = usePixlApi()
const query = ref('')
const results = ref([])
const loading = ref(false)
const open = ref(false)
let timer = null

watch(query, (val) => {
  if (timer) clearTimeout(timer)
  const q = val.trim()
  if (!q) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    loading.value = true
    try {
      const res = await api.request('/users/search/all', { query: { username: q } })
      results.value = Array.isArray(res) ? res : []
      open.value = true
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 280)
})

function pick(user) {
  emit('select', user)
  query.value = user.userName || ''
  open.value = false
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>
