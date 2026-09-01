<template>
  <div v-if="item">
    <AdminPageHeader title="Case" :subtitle="item.case.category" :crumbs="[{ to: '/admin/moderation', label: 'Queue' }]" />
    <div class="mb-4 flex flex-wrap gap-2">
      <AdminStatusBadge :value="item.case.status" />
      <AdminStatusBadge :value="item.case.severity" />
    </div>
    <div class="mb-6 flex flex-wrap gap-2">
      <UiButton size="sm" @click="act('claim')">Claim</UiButton>
      <UiButton size="sm" variant="secondary" @click="act('escalate')">Escalate</UiButton>
      <UiButton size="sm" variant="secondary" @click="act('resolve')">Resolve</UiButton>
      <UiButton size="sm" variant="ghost" @click="act('dismiss')">Dismiss</UiButton>
      <UiButton size="sm" variant="ghost" @click="noteOpen = true">Note</UiButton>
    </div>
    <div class="grid gap-4 lg:grid-cols-2">
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6 text-sm">
        <h2 class="mb-2 font-semibold">Target</h2>
        <p>{{ item.case.targetType }} {{ item.case.targetId }}</p>
        <NuxtLink v-if="item.targetUser" :to="`/admin/users/${item.targetUser.id}`" class="text-pixl-accent-2">
          @{{ item.targetUser.userName }}
        </NuxtLink>
        <NuxtLink v-if="item.report" :to="`/admin/reports/${item.report.id}`" class="mt-2 block text-pixl-accent-2">Open report</NuxtLink>
      </section>
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6 text-sm">
        <h2 class="mb-2 font-semibold">Actions</h2>
        <ul class="space-y-2 text-pixl-muted">
          <li v-for="a in item.actions" :key="a.id">{{ a.type }} · {{ a.reason }}</li>
          <li v-if="!item.actions.length">None yet.</li>
        </ul>
      </section>
    </div>
    <AdminConfirmDialog :open="!!pending" :title="pending" message="This updates the case for all staff." @close="pending = ''" @confirm="confirm" />
    <AdminConfirmDialog :open="noteOpen" title="Internal note" @close="noteOpen = false" @confirm="saveNote" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const route = useRoute()
const admin = useAdmin()
const item = ref(null)
const pending = ref('')
const noteOpen = ref(false)
async function load() {
  item.value = await admin.get(`/admin/moderation/${route.params.id}`)
}
onMounted(load)
function act(action) { pending.value = action }
async function confirm({ reason }) {
  await admin.act(`/admin/moderation/${route.params.id}/actions`, { action: pending.value, reason }, { success: 'Case updated' })
  pending.value = ''
  await load()
}
async function saveNote({ reason }) {
  await admin.act(`/admin/moderation/${route.params.id}/actions`, { action: 'note', body: reason }, { success: 'Note added' })
  noteOpen.value = false
  await load()
}
</script>
