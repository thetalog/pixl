<template>
  <div>
    <AdminPageHeader title="Users" subtitle="Search, filter, and open an account for moderation." />
    <AdminFilters v-model="query" :dates="true" search-placeholder="Name, username, email" :filters="filters" />
    <AdminTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :row-href="(row) => `/admin/users/${row.id}`"
    >
      <template #accountStatus="{ row }"><AdminStatusBadge :value="row.accountStatus" /></template>
      <template #roleKey="{ row }"><AdminStatusBadge :value="row.roleKey" /></template>
    </AdminTable>
    <AdminPagination v-model:page="query.page" :pages="pages" :total="total" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const { query, rows, total, pages, loading } = useAdminList('/admin/users')
const columns = [
  { key: 'userName', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'roleKey', label: 'Role' },
  { key: 'accountStatus', label: 'Status' },
  { key: 'createdAt', label: 'Created', format: 'date' },
]
const filters = [
  { key: 'roleKey', label: 'Role', options: ['USER', 'SUPPORT', 'ANALYST', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'].map((v) => ({ value: v, label: v })) },
  { key: 'accountStatus', label: 'Status', options: ['ACTIVE', 'SUSPENDED', 'BANNED'].map((v) => ({ value: v, label: v })) },
]
</script>
