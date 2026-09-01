<template>
  <div>
    <AdminPageHeader title="Appeals" />
    <AdminFilters v-model="query" :filters="filters" />
    <AdminTable :columns="columns" :rows="rows" :loading="loading">
      <template #status="{ row }"><AdminStatusBadge :value="row.status" /></template>
      <template #id="{ row }">
        <UiButton v-if="admin.can('moderation.appeal')" size="sm" @click="pick(row, 'UPHELD')">Uphold</UiButton>
        <UiButton v-if="admin.can('moderation.appeal')" size="sm" variant="secondary" @click="pick(row, 'OVERTURNED')">Overturn</UiButton>
      </template>
    </AdminTable>
    <AdminPagination v-model:page="query.page" :pages="pages" :total="total" />
    <AdminConfirmDialog :open="!!target" :title="decision" @close="target = null" @confirm="run" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const { admin, query, rows, total, pages, loading, load } = useAdminList('/admin/appeals')
const columns = [
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'statement', label: 'Statement' },
  { key: 'createdAt', label: 'Opened', format: 'date' },
  { key: 'id', label: '' },
]
const filters = [
  { key: 'status', label: 'Status', options: ['NEW', 'IN_REVIEW', 'UPHELD', 'OVERTURNED', 'PARTIAL'].map((v) => ({ value: v, label: v })) },
]
const target = ref(null)
const decision = ref('')
function pick(row, d) { target.value = row; decision.value = d }
async function run({ reason }) {
  await admin.act(`/admin/appeals/${target.value.id}/review`, { decision: decision.value, reason }, { success: 'Appeal reviewed' })
  target.value = null
  await load()
}
</script>
