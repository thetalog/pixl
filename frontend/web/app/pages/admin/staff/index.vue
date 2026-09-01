<template>
  <div>
    <AdminPageHeader title="Staff" subtitle="Assign roles from a user profile. Super admin cannot be granted by a lower role." />
    <AdminFilters v-model="query" search-placeholder="Staff name or email" :filters="filters" />
    <AdminTable :columns="columns" :rows="rows" :loading="loading" :row-href="(row) => `/admin/users/${row.id}`">
      <template #roleKey="{ row }"><AdminStatusBadge :value="row.roleKey" /></template>
    </AdminTable>
    <AdminPagination v-model:page="query.page" :pages="pages" :total="total" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const { query, rows, total, pages, loading } = useAdminList('/admin/staff')
const columns = [
  { key: 'userName', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'roleKey', label: 'Role' },
  { key: 'lastLoginAt', label: 'Last login', format: 'date' },
]
const filters = [
  { key: 'roleKey', label: 'Role', options: ['SUPPORT', 'ANALYST', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'].map((v) => ({ value: v, label: v })) },
]
</script>
