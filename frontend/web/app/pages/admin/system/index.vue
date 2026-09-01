<template>
  <div>
    <AdminPageHeader title="System health" subtitle="Only checks that this process can actually perform." />
    <div v-if="data" class="grid gap-3 sm:grid-cols-3">
      <div v-for="(item, key) in data.health" :key="key" class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold capitalize">{{ key }}</h2>
          <AdminStatusBadge :value="item.ok ? 'ACTIVE' : 'FAILED'" />
        </div>
        <p class="mt-2 text-sm text-pixl-muted">{{ item.detail }}</p>
      </div>
    </div>
    <p v-if="data" class="mt-4 text-xs text-pixl-tertiary">Measured {{ data.measuredAt }}</p>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const admin = useAdmin()
const data = ref(null)
onMounted(async () => {
  data.value = await admin.get('/admin/system')
})
</script>
