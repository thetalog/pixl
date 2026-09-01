<template>
  <div>
    <AdminPageHeader title="Moderation queue" subtitle="Claim work before acting. Concurrent claims are rejected." />
    <AdminFilters v-model="query" :filters="filters" />
    <AdminTable :columns="columns" :rows="rows" :loading="loading" :row-href="(row) => `/admin/moderation/${row.id}`">
      <template #status="{ row }"><AdminStatusBadge :value="row.status" /></template>
      <template #severity="{ row }"><AdminStatusBadge :value="row.severity" /></template>
    </AdminTable>
    <AdminPagination v-model:page="query.page" :pages="pages" :total="total" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const { query, rows, total, pages, loading } = useAdminList('/admin/moderation')
const columns = [
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'severity', label: 'Severity' },
  { key: 'category', label: 'Category' },
  { key: 'targetType', label: 'Target' },
  { key: 'createdAt', label: 'Opened', format: 'date' },
]
const filters = [
  { key: 'status', label: 'Status', options: ['NEW', 'IN_REVIEW', 'NEEDS_INFO', 'ACTION_TAKEN', 'ESCALATED', 'RESOLVED', 'DISMISSED'].map((v) => ({ value: v, label: v })) },
  { key: 'severity', label: 'Severity', options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((v) => ({ value: v, label: v })) },
  { key: 'assigneeId', label: 'Assignee', options: [{ value: 'me', label: 'Mine' }, { value: 'unassigned', label: 'Unassigned' }] },
]
</script>
