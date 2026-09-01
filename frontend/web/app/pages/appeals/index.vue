<template>
  <div class="mx-auto max-w-lg px-4 py-8">
    <h1 class="text-2xl font-semibold tracking-tight">Appeals</h1>
    <p class="mt-1 text-sm text-pixl-muted">Ask staff to review a suspension, ban, content removal, or livestream restriction.</p>
    <form class="mt-6 space-y-3 rounded-card bg-pixl-card p-4 ring-1 ring-white/6" @submit.prevent="submit">
      <label class="block text-sm">
        <span class="mb-1.5 block text-pixl-muted">Type</span>
        <select v-model="type" class="h-10 w-full rounded-control border border-white/8 bg-pixl-elevated px-3">
          <option value="SUSPENSION">Account suspension</option>
          <option value="BAN">Account ban</option>
          <option value="CONTENT_REMOVAL">Content removal</option>
          <option value="LIVESTREAM_RESTRICTION">Livestream restriction</option>
        </select>
      </label>
      <UiTextField v-model="statement" label="What should we know?" multiline />
      <UiButton type="submit" :disabled="statement.trim().length < 3" :loading="sending">Submit appeal</UiButton>
    </form>
    <ul class="mt-6 space-y-3">
      <li v-for="row in items" :key="row.id" class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <div class="flex justify-between gap-2 text-sm">
          <span>{{ row.type }}</span>
          <AdminStatusBadge :value="row.status" />
        </div>
        <p class="mt-2 text-sm text-pixl-muted">{{ row.statement }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })
const api = usePixlApi()
const toast = useToast()
const type = ref('SUSPENSION')
const statement = ref('')
const sending = ref(false)
const items = ref([])
async function load() {
  const res = await api.request('/appeals')
  items.value = res?.data?.items || []
}
onMounted(load)
async function submit() {
  sending.value = true
  try {
    await api.request('/appeals', { method: 'POST', body: { type: type.value, statement: statement.value } })
    toast.success('Appeal submitted')
    statement.value = ''
    await load()
  } catch (error) {
    toast.error(error?.data?.message || 'Could not submit appeal')
  } finally {
    sending.value = false
  }
}
</script>
