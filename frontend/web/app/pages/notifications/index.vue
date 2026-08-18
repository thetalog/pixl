<script setup>
definePageMeta({ middleware: 'auth' })

const { items, loading, refresh, approveRequest, rejectRequest } = useRequests()

onMounted(() => refresh())

function nameOf(row) {
  return row?.user?.name || row?.user?.userName || row?.requesterUsername || 'Someone'
}
function handleOf(row) {
  return row?.user?.userName || row?.requesterUsername || ''
}
</script>

<template>
  <div class="mx-auto w-full max-w-lg px-4 py-8">
    <h1 class="text-2xl font-semibold tracking-tight">Requests</h1>
    <p class="mt-1 text-sm text-pixl-muted">Incoming follow requests.</p>

    <div v-if="loading && items.length === 0" class="mt-6 space-y-3">
      <UiSkeleton v-for="n in 4" :key="n" height="64px" rounded="rounded-card" />
    </div>
    <UiEmptyState v-else-if="items.length === 0" title="No follow requests right now." cta="Find people" @action="navigateTo('/search')" />
    <ul v-else class="mt-6 space-y-3">
      <li
        v-for="row in items"
        :key="row.id"
        class="flex items-center gap-3 rounded-card bg-pixl-card p-3 ring-1 ring-white/6"
      >
        <UiAvatar
          :src="row.user?.profilePic"
          :alt="handleOf(row)"
          :size="40"
          :to="handleOf(row) ? `/profile/${handleOf(row)}` : ''"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">{{ nameOf(row) }}</p>
          <p v-if="handleOf(row)" class="truncate text-xs text-pixl-tertiary">@{{ handleOf(row) }}</p>
        </div>
        <UiButton size="sm" @click="approveRequest(row)">Accept</UiButton>
        <UiButton size="sm" variant="secondary" @click="rejectRequest(row)">Reject</UiButton>
      </li>
    </ul>
  </div>
</template>
