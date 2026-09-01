<template>
  <div v-if="item">
    <AdminPageHeader :title="item.stream.title" :crumbs="[{ to: '/admin/livestreams', label: 'Livestreams' }]" />
    <div class="mb-4 flex flex-wrap gap-2">
      <AdminStatusBadge :value="item.stream.status" />
      <span class="text-sm text-pixl-muted">{{ item.viewers?.length || item.stream.viewerCount || 0 }} viewers</span>
    </div>
    <p class="mb-4 text-sm text-pixl-muted">
      Host
      <NuxtLink v-if="item.stream.user" :to="`/admin/users/${item.stream.user.id}`" class="text-pixl-accent-2">
        @{{ item.stream.user.userName }}
      </NuxtLink>
    </p>
    <div class="mb-6 flex flex-wrap gap-2">
      <UiButton v-if="admin.can('livestreams.stop') && isActive" variant="danger" @click="stopOpen = true">Stop stream</UiButton>
      <UiButton v-if="admin.can('livestreams.restrict') && item.stream.user" variant="secondary" @click="restrictOpen = true">
        Suspend live privileges
      </UiButton>
    </div>
    <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6 text-sm">
      <h2 class="mb-2 font-semibold">Livestream service</h2>
      <pre class="overflow-auto text-xs text-pixl-muted">{{ JSON.stringify(item.java, null, 2) }}</pre>
    </section>
    <section class="mt-4 rounded-card bg-pixl-card p-4 ring-1 ring-white/6 text-sm">
      <h2 class="mb-2 font-semibold">Reports</h2>
      <ul>
        <li v-for="r in item.reports" :key="r.id">
          <NuxtLink :to="`/admin/reports/${r.id}`" class="text-pixl-accent-2">{{ r.category }} · {{ r.status }}</NuxtLink>
        </li>
        <li v-if="!item.reports.length" class="text-pixl-muted">No reports.</li>
      </ul>
    </section>
    <AdminConfirmDialog :open="stopOpen" title="Terminate livestream" danger confirm-word="STOP" message="The Java livestream service will destroy the media room. This is audited." @close="stopOpen = false" @confirm="stop" />
    <AdminConfirmDialog :open="restrictOpen" title="Suspend live privileges" danger @close="restrictOpen = false" @confirm="restrict" />
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const route = useRoute()
const admin = useAdmin()
const item = ref(null)
const stopOpen = ref(false)
const restrictOpen = ref(false)
const isActive = computed(() => ['CREATED', 'STARTING', 'LIVE'].includes(item.value?.stream?.status))
async function load() { item.value = await admin.get(`/admin/livestreams/${route.params.id}`) }
onMounted(load)
async function stop({ reason }) {
  await admin.act(`/admin/livestreams/${route.params.id}/stop`, { reason }, { success: 'Stream terminated by livestream service' })
  stopOpen.value = false
  await load()
}
async function restrict({ reason }) {
  await admin.act(`/admin/livestreams/hosts/${item.value.stream.userId}/restrict`, { reason, revoked: true }, { success: 'Live privileges suspended' })
  restrictOpen.value = false
  await load()
}
</script>
