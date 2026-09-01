<template>
  <div>
    <AdminPageHeader title="Analytics" subtitle="Counts from MongoDB for the selected range. No estimated or fake metrics." />
    <AdminFilters v-model="range" :dates="true" />
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="card in cards" :key="card.label" class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <p class="text-xs uppercase text-pixl-tertiary">{{ card.label }}</p>
        <p class="mt-2 text-2xl font-semibold">{{ card.value }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const admin = useAdmin()
const range = ref({ from: '', to: '' })
const data = ref(null)
async function load() {
  data.value = await admin.get('/admin/analytics', range.value)
}
watch(range, load, { deep: true })
onMounted(load)
const cards = computed(() => [
  { label: 'New users', value: data.value?.newUsers ?? '—' },
  { label: 'New posts', value: data.value?.newPosts ?? '—' },
  { label: 'Reports', value: data.value?.reports ?? '—' },
  { label: 'Moderation actions', value: data.value?.moderationActions ?? '—' },
  { label: 'Livestreams', value: data.value?.livestreams ?? '—' },
])
</script>
