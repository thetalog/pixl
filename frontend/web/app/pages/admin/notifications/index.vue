<template>
  <div>
    <AdminPageHeader title="Notifications" subtitle="Broadcasts are delivered as in-app Activity items and are audited." />
    <form class="mb-6 max-w-xl space-y-3 rounded-card bg-pixl-card p-4 ring-1 ring-white/6" @submit.prevent="send">
      <UiTextField v-model="title" label="Title" />
      <UiTextField v-model="body" label="Message" multiline />
      <label class="block text-sm">
        <span class="mb-1.5 block text-pixl-muted">Audience</span>
        <select v-model="audience" class="h-10 w-full rounded-control border border-white/8 bg-pixl-elevated px-3">
          <option value="ALL">All active users</option>
          <option value="STAFF">Staff only</option>
        </select>
      </label>
      <UiButton v-if="admin.can('notifications.broadcast') || admin.can('notifications.send')" type="submit" :loading="sending">Send</UiButton>
    </form>
    <AdminTable :columns="columns" :rows="rows" :loading="loading" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const { admin, rows, loading, load } = useAdminList('/admin/notifications')
const columns = [
  { key: 'title', label: 'Title' },
  { key: 'audience', label: 'Audience' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Sent', format: 'date' },
]
const title = ref('')
const body = ref('')
const audience = ref('STAFF')
const sending = ref(false)
async function send() {
  sending.value = true
  try {
    await admin.act('/admin/notifications/broadcast', { title: title.value, body: body.value, audience: audience.value }, { success: 'Announcement sent' })
    title.value = ''
    body.value = ''
    await load()
  } finally {
    sending.value = false
  }
}
</script>
