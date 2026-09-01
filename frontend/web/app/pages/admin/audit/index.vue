<template>
  <div>
    <AdminPageHeader title="Audit logs" subtitle="Immutable. There is no edit API.">
      <UiButton v-if="admin.can('audit.export')" size="sm" variant="secondary" @click="exp">Export page</UiButton>
    </AdminPageHeader>
    <AdminFilters v-model="query" :dates="true" search-placeholder="Action or reason" />
    <AdminTable :columns="columns" :rows="rows" :loading="loading" />
    <AdminPagination v-model:page="query.page" :pages="pages" :total="total" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const { admin, query, rows, total, pages, loading } = useAdminList('/admin/audit-logs')
const columns = [
  { key: 'action', label: 'Action' },
  { key: 'actorRole', label: 'Actor role' },
  { key: 'targetType', label: 'Target' },
  { key: 'targetId', label: 'Target id' },
  { key: 'reason', label: 'Reason' },
  { key: 'ip', label: 'IP' },
  { key: 'createdAt', label: 'When', format: 'date' },
]
async function exp() {
  const data = await admin.get('/admin/audit-logs/export', query.value)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pixl-audit.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>
