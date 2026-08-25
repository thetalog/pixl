<template>
  <div class="relative" ref="root">
    <label v-if="label" class="mb-1.5 block text-sm font-medium text-pixl-muted">{{ label }}</label>
    <input
      v-model="query"
      type="text"
      :placeholder="placeholder"
      autocomplete="off"
      class="h-10 w-full rounded-control border border-white/8 bg-pixl-elevated px-3 text-sm text-pixl-text placeholder:text-pixl-tertiary focus:border-pixl-accent/60 focus:ring-2 focus:ring-pixl-accent/40"
      @focus="open = true"
      @keydown.escape="open = false"
      @keydown.down.prevent="highlightNext"
      @keydown.up.prevent="highlightPrev"
      @keydown.enter.prevent="pickHighlighted"
    />
    <div
      v-if="open && query.trim().length >= 2"
      class="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-card border border-white/8 bg-pixl-elevated shadow-pixl"
    >
      <div v-if="loading" class="px-3 py-2 text-sm text-pixl-muted">Searching places…</div>
      <button
        v-for="(place, i) in results"
        :key="place.id"
        type="button"
        class="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-white/6"
        :class="i === highlight ? 'bg-white/8' : ''"
        @mousedown.prevent="pick(place)"
      >
        <span class="truncate text-sm font-medium text-pixl-text">{{ place.label || place.name }}</span>
        <span v-if="place.name && place.name !== place.label" class="truncate text-xs text-pixl-tertiary">
          {{ place.name }}
        </span>
      </button>
      <div v-if="!loading && results.length === 0" class="px-3 py-2 text-sm text-pixl-muted">
        No places found
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Location' },
  placeholder: { type: String, default: 'City, beach, landmark…' },
})
const emit = defineEmits(['update:modelValue', 'select'])

const api = usePixlApi()
const query = ref(props.modelValue || '')
const results = ref([])
const loading = ref(false)
const open = ref(false)
const highlight = ref(0)
const root = ref(null)
let timer = null

watch(
  () => props.modelValue,
  (val) => {
    if (val !== query.value) query.value = val || ''
  }
)

watch(query, (val) => {
  emit('update:modelValue', val)
  if (timer) clearTimeout(timer)
  const q = val.trim()
  if (q.length < 2) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    loading.value = true
    try {
      const res = await api.request('/services/locations', { query: { q, limit: '8' } })
      results.value = Array.isArray(res?.data) ? res.data : []
      highlight.value = 0
      open.value = true
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 320)
})

function pick(place) {
  const value = place?.label || place?.name || ''
  query.value = value
  emit('update:modelValue', value)
  emit('select', place)
  open.value = false
}

function highlightNext() {
  if (!results.value.length) return
  highlight.value = (highlight.value + 1) % results.value.length
}

function highlightPrev() {
  if (!results.value.length) return
  highlight.value = (highlight.value - 1 + results.value.length) % results.value.length
}

function pickHighlighted() {
  if (results.value[highlight.value]) pick(results.value[highlight.value])
}

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  if (timer) clearTimeout(timer)
})
</script>
