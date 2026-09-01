<template>
  <div>
    <AdminPageHeader title="Feature flags" subtitle="High-impact switches. Changes are audited and fail closed to the previous stored value." />
    <div class="space-y-3">
      <div v-for="flag in flags" :key="flag.key" class="flex flex-wrap items-center justify-between gap-3 rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <div>
          <p class="font-semibold">{{ flag.key }}</p>
          <p class="text-sm text-pixl-muted">{{ flag.description }}</p>
        </div>
        <div class="flex items-center gap-3">
          <AdminStatusBadge :value="flag.enabled ? 'ACTIVE' : 'OFF'" />
          <UiButton v-if="admin.can('feature_flags.update')" size="sm" :variant="flag.enabled ? 'danger' : 'primary'" @click="pick(flag)">
            {{ flag.enabled ? 'Disable' : 'Enable' }}
          </UiButton>
        </div>
      </div>
    </div>
    <AdminConfirmDialog :open="!!target" :title="target?.enabled ? 'Disable flag' : 'Enable flag'" danger confirm-word="CONFIRM" @close="target = null" @confirm="run" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const admin = useAdmin()
const flags = ref([])
const target = ref(null)
async function load() {
  const data = await admin.get('/admin/feature-flags')
  flags.value = data.flags || []
}
onMounted(load)
function pick(flag) { target.value = flag }
async function run({ reason }) {
  await admin.act(`/admin/feature-flags/${target.value.key}`, { enabled: !target.value.enabled, reason }, { success: 'Flag updated' })
  target.value = null
  await load()
}
</script>
