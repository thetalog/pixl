<template>
  <div>
    <AdminPageHeader title="Settings" subtitle="Extensible lists such as report categories. Values are JSON." />
    <div class="space-y-4">
      <section v-for="row in rows" :key="row.id" class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <h2 class="font-semibold">{{ row.key }}</h2>
        <textarea v-model="drafts[row.key]" class="mt-2 min-h-[120px] w-full rounded-control border border-white/8 bg-pixl-elevated p-3 font-mono text-xs" />
        <UiButton v-if="admin.can('settings.update')" class="mt-3" size="sm" @click="save(row)">Save</UiButton>
      </section>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const admin = useAdmin()
const toast = useToast()
const rows = ref([])
const drafts = reactive({})
onMounted(async () => {
  rows.value = await admin.get('/admin/settings')
  for (const row of rows.value) drafts[row.key] = JSON.stringify(row.value, null, 2)
})
async function save(row) {
  let value
  try {
    value = JSON.parse(drafts[row.key])
  } catch {
    toast.error('Invalid JSON')
    return
  }
  await admin.act(`/admin/settings/${row.key}`, { value, reason: 'Updated from admin settings' }, { success: 'Setting saved' })
}
</script>
