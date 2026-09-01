<template>
  <div v-if="item">
    <AdminPageHeader title="Report" :subtitle="item.report.category" :crumbs="[{ to: '/admin/reports', label: 'Reports' }]" />
    <AdminStatusBadge :value="item.report.status" />
    <p class="mt-3 text-sm">{{ item.report.reason }}</p>
    <p class="mt-1 text-sm text-pixl-muted">{{ item.report.details }}</p>
    <div class="mt-4 flex flex-wrap gap-2">
      <UiButton size="sm" @click="act('claim')">Claim</UiButton>
      <UiButton size="sm" variant="secondary" @click="act('resolve')">Resolve</UiButton>
      <UiButton size="sm" variant="ghost" @click="act('dismiss')">Dismiss</UiButton>
      <UiButton size="sm" variant="secondary" @click="act('escalate')">Escalate</UiButton>
      <NuxtLink v-if="item.targetUser" :to="`/admin/users/${item.targetUser.id}`">
        <UiButton size="sm" variant="tertiary">Reported account</UiButton>
      </NuxtLink>
    </div>
    <AdminConfirmDialog :open="!!pending" :title="pending" @close="pending = ''" @confirm="confirm" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const route = useRoute()
const admin = useAdmin()
const item = ref(null)
const pending = ref('')
async function load() { item.value = await admin.get(`/admin/reports/${route.params.id}`) }
onMounted(load)
function act(action) { pending.value = action }
async function confirm({ reason }) {
  await admin.act(`/admin/reports/${route.params.id}/actions`, { action: pending.value, reason }, { success: 'Report updated' })
  pending.value = ''
  await load()
}
</script>
