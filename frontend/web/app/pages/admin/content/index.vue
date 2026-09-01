<template>
  <div>
    <AdminPageHeader title="Content" subtitle="Posts, reels, and stories. Removals are reversible." />
    <AdminFilters v-model="query" search-placeholder="Caption" :filters="filters" />
    <div v-if="selected.length" class="mb-3 flex gap-2">
      <UiButton v-if="admin.can('content.hide')" size="sm" @click="bulkAction = 'hide'">Hide selected</UiButton>
      <UiButton v-if="admin.can('content.restore')" size="sm" variant="secondary" @click="bulkAction = 'restore'">Restore selected</UiButton>
    </div>
    <AdminTable :columns="columns" :rows="rows" :loading="loading" selectable :selected="selected" @toggle="onToggle" @toggle-all="onAll">
      <template #caption="{ row }">{{ row.caption || '—' }}</template>
      <template #user="{ row }">{{ row.user?.userName || '—' }}</template>
      <template #state="{ row }">
        <AdminStatusBadge :value="row.postDisabled || row.hidden ? 'HIDDEN' : 'VISIBLE'" />
      </template>
      <template #id="{ row }">
        <UiButton size="sm" variant="ghost" @click.stop="pick(row)">Moderate</UiButton>
      </template>
    </AdminTable>
    <AdminPagination v-model:page="query.page" :pages="pages" :total="total" />
    <AdminConfirmDialog :open="!!target || !!bulkAction" :title="bulkAction || 'Moderate content'" :danger="true" @close="close" @confirm="run" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const { admin, query, rows, total, pages, loading, selected, load } = useAdminList('/admin/content', { extra: () => ({ type: query.value.type || 'POST' }) })
query.value.type = 'POST'
const columns = [
  { key: 'caption', label: 'Caption' },
  { key: 'user', label: 'Author' },
  { key: 'state', label: 'State' },
  { key: 'createdAt', label: 'Created', format: 'date' },
  { key: 'id', label: '' },
]
const filters = [
  { key: 'type', label: 'Type', options: ['POST', 'REEL', 'STORY'].map((v) => ({ value: v, label: v })) },
  { key: 'disabled', label: 'Visibility', options: [{ value: 'true', label: 'Hidden' }, { value: 'false', label: 'Visible' }] },
]
const target = ref(null)
const bulkAction = ref('')
function pick(row) { target.value = row }
function close() { target.value = null; bulkAction.value = '' }
function onToggle(id, on) { selected.value = on ? [...selected.value, id] : selected.value.filter((x) => x !== id) }
function onAll(on) { selected.value = on ? rows.value.map((r) => r.id) : [] }
async function run({ reason }) {
  if (bulkAction.value) {
    await admin.act('/admin/bulk', { type: query.value.type || 'POST', action: bulkAction.value === 'hide' ? 'hide' : 'restore', ids: selected.value, reason }, { success: 'Bulk complete' })
    selected.value = []
  } else if (target.value) {
    await admin.act(`/admin/content/${target.value.id}/actions`, { type: query.value.type || 'POST', action: 'remove', reason }, { success: 'Content updated' })
  }
  close()
  await load()
}
</script>
