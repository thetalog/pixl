<template>
  <div>
    <AdminPageHeader title="Reports" />
    <div v-if="selected.length && admin.can('reports.resolve')" class="mb-3 flex gap-2">
      <UiButton size="sm" @click="bulk('resolve')">Resolve selected</UiButton>
      <UiButton size="sm" variant="secondary" @click="bulk('dismiss')">Dismiss selected</UiButton>
    </div>
    <AdminFilters v-model="query" :dates="true" :filters="filters" />
    <AdminTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      selectable
      :selected="selected"
      :row-href="(row) => `/admin/reports/${row.id}`"
      @toggle="onToggle"
      @toggle-all="onToggleAll"
    >
      <template #status="{ row }"><AdminStatusBadge :value="row.status" /></template>
      <template #severity="{ row }"><AdminStatusBadge :value="row.severity" /></template>
    </AdminTable>
    <AdminPagination v-model:page="query.page" :pages="pages" :total="total" />
    <AdminConfirmDialog :open="!!bulkAction" :title="`Bulk ${bulkAction}`" :message="`This will affect ${selected.length} reports.`" @close="bulkAction = ''" @confirm="runBulk" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const { admin, query, rows, total, pages, loading, selected, load } = useAdminList('/admin/reports')
const columns = [
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'severity', label: 'Severity' },
  { key: 'targetType', label: 'Target' },
  { key: 'createdAt', label: 'Created', format: 'date' },
]
const filters = [
  { key: 'status', label: 'Status', options: ['NEW', 'IN_REVIEW', 'ESCALATED', 'RESOLVED', 'DISMISSED'].map((v) => ({ value: v, label: v })) },
  { key: 'severity', label: 'Severity', options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((v) => ({ value: v, label: v })) },
]
const bulkAction = ref('')
function onToggle(id, on) {
  selected.value = on ? [...selected.value, id] : selected.value.filter((x) => x !== id)
}
function onToggleAll(on) {
  selected.value = on ? rows.value.map((r) => r.id) : []
}
function bulk(action) { bulkAction.value = action }
async function runBulk({ reason }) {
  await admin.act('/admin/bulk', { type: 'REPORT', action: bulkAction.value, ids: selected.value, reason }, { success: 'Bulk update complete' })
  bulkAction.value = ''
  selected.value = []
  await load()
}
</script>
