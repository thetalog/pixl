<template>
  <div>
    <AdminPageHeader title="Comments" />
    <AdminFilters v-model="query" search-placeholder="Comment text" :filters="filters" />
    <AdminTable :columns="columns" :rows="rows" :loading="loading">
      <template #hidden="{ row }"><AdminStatusBadge :value="row.hidden ? 'HIDDEN' : 'VISIBLE'" /></template>
      <template #id="{ row }">
        <UiButton v-if="admin.can('comments.hide')" size="sm" variant="ghost" @click="pick(row)">Moderate</UiButton>
      </template>
    </AdminTable>
    <AdminPagination v-model:page="query.page" :pages="pages" :total="total" />
    <AdminConfirmDialog :open="!!target" title="Hide or restore comment" @close="target = null" @confirm="run" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const { admin, query, rows, total, pages, loading, load } = useAdminList('/admin/comments')
const columns = [
  { key: 'text', label: 'Comment' },
  { key: 'user.userName', label: 'User' },
  { key: 'hidden', label: 'State' },
  { key: 'createdAt', label: 'Created', format: 'date' },
  { key: 'id', label: '' },
]
const filters = [{ key: 'hidden', label: 'State', options: [{ value: 'true', label: 'Hidden' }, { value: 'false', label: 'Visible' }] }]
const target = ref(null)
function pick(row) { target.value = row }
async function run({ reason }) {
  const action = target.value.hidden ? 'restore' : 'remove'
  await admin.act(`/admin/comments/${target.value.id}/actions`, { action, reason }, { success: 'Comment updated' })
  target.value = null
  await load()
}
</script>
