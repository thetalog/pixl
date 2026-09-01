<template>
  <div>
    <AdminPageHeader title="Support" subtitle="Look up an account and add an internal note." />
    <AdminFilters v-model="query" search-placeholder="Find a user" />
    <AdminTable :columns="columns" :rows="rows" :loading="loading" :row-href="(row) => `/admin/users/${row.id}`" />
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
  { key: 'accountStatus', label: 'Status' },
]
</script>
