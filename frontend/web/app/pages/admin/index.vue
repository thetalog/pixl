<template>
  <div>
    <AdminPageHeader title="Dashboard" subtitle="Live operational snapshot. Metrics are counted from the database." />
    <p v-if="error" class="mb-4 text-sm text-pixl-danger">{{ error }}</p>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="card in cards" :key="card.label" class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <p class="text-xs uppercase tracking-wide text-pixl-tertiary">{{ card.label }}</p>
        <p class="mt-2 text-2xl font-semibold">{{ card.value }}</p>
      </div>
    </div>
    <div class="mt-6 grid gap-4 lg:grid-cols-2">
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <h2 class="mb-3 font-semibold">Recent moderation</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="row in data?.recentModeration || []" :key="row.id" class="flex justify-between gap-3 text-pixl-muted">
            <span>{{ row.type }} · {{ row.targetType }}</span>
            <span>{{ format(row.createdAt) }}</span>
          </li>
          <li v-if="!(data?.recentModeration || []).length" class="text-pixl-tertiary">No recent actions.</li>
        </ul>
      </section>
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <h2 class="mb-3 font-semibold">Recent bans & suspensions</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="row in data?.recentBans || []" :key="row.id" class="flex justify-between gap-3 text-pixl-muted">
            <span>{{ row.type }}</span>
            <span>{{ format(row.createdAt) }}</span>
          </li>
          <li v-if="!(data?.recentBans || []).length" class="text-pixl-tertiary">None recently.</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const admin = useAdmin()
const data = ref(null)
const error = ref('')
onMounted(async () => {
  try {
    data.value = await admin.get('/admin/dashboard')
  } catch (e) {
    error.value = e?.data?.message || 'Could not load dashboard'
  }
})
const cards = computed(() => {
  const k = data.value?.kpis || {}
  return [
    { label: 'Total users', value: k.totalUsers ?? '—' },
    { label: 'Active (30d login)', value: k.activeUsers ?? '—' },
    { label: 'New users', value: k.newUsers ?? '—' },
    { label: 'Suspended', value: k.suspendedUsers ?? '—' },
    { label: 'Banned', value: k.bannedUsers ?? '—' },
    { label: 'Pending reports', value: k.pendingReports ?? '—' },
    { label: 'Urgent reports', value: k.urgentReports ?? '—' },
    { label: 'Open queue', value: k.pendingModerationActions ?? '—' },
    { label: 'Unresolved appeals', value: k.unresolvedAppeals ?? '—' },
    { label: 'Live now', value: k.livestreamsLive ?? '—' },
  ]
})
function format(v) {
  return v ? new Date(v).toLocaleString() : ''
}
</script>
