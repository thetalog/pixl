<template>
  <div>
    <AdminPageHeader title="Livestreams" subtitle="Termination is enforced by the Java livestream service, not the web app." />
    <AdminFilters v-model="query" search-placeholder="Title" :filters="filters" />
    <AdminTable :columns="columns" :rows="rows" :loading="loading" :row-href="(row) => `/admin/livestreams/${row.id}`">
      <template #status="{ row }"><AdminStatusBadge :value="row.status" /></template>
    </AdminTable>
    <AdminPagination v-model:page="query.page" :pages="pages" :total="total" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const { query, rows, total, pages, loading } = useAdminList('/admin/livestreams')
const columns = [
  { key: 'title', label: 'Title' },
  { key: 'user.userName', label: 'Host' },
  { key: 'status', label: 'Status' },
  { key: 'viewerCount', label: 'Viewers' },
  { key: 'createdAt', label: 'Created', format: 'date' },
]
const filters = [
  { key: 'status', label: 'Status', options: ['LIVE', 'STARTING', 'CREATED', 'ENDED', 'FAILED'].map((v) => ({ value: v, label: v })) },
]
</script>
