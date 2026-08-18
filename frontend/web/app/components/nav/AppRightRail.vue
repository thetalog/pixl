<template>
  <aside class="hidden w-[320px] shrink-0 xl:block">
    <div class="sticky top-6 space-y-4">
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold">Follow requests</h2>
          <NuxtLink to="/notifications" class="text-xs text-pixl-accent hover:text-pixl-accent-2">See all</NuxtLink>
        </div>
        <div v-if="loading && items.length === 0" class="space-y-3">
          <UiSkeleton v-for="n in 3" :key="n" height="44px" />
        </div>
        <p v-else-if="items.length === 0" class="text-sm text-pixl-muted">No pending requests.</p>
        <ul v-else class="space-y-3">
          <li v-for="row in items.slice(0, 4)" :key="row.id" class="flex items-center gap-2">
            <UiAvatar :src="row.user?.profilePic" :alt="requesterName(row)" :size="40" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ requesterName(row) }}</p>
            </div>
            <UiButton size="sm" @click="approveRequest(row)">Accept</UiButton>
          </li>
        </ul>
      </section>

      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <h2 class="mb-2 text-sm font-semibold">Find people</h2>
        <p class="mb-3 text-sm text-pixl-muted">Search usernames to follow new accounts.</p>
        <UiButton variant="secondary" block @click="navigateTo('/search')">Search</UiButton>
      </section>

      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <div class="mb-2 flex items-center gap-2">
          <span class="h-1.5 w-1.5 rounded-full bg-pixl-cyan" />
          <h2 class="text-sm font-semibold">Live</h2>
        </div>
        <p class="mb-3 text-sm text-pixl-muted">Go live and share a moment.</p>
        <UiButton variant="secondary" block @click="navigateTo('/live')">Go live</UiButton>
      </section>
    </div>
  </aside>
</template>

<script setup>
const { items, loading, refresh, approveRequest } = useRequests()

onMounted(() => {
  refresh()
})

function requesterName(row) {
  return row?.user?.userName || row?.requesterUsername || 'User'
}
</script>
