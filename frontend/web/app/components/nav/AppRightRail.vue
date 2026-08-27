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
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-sm font-semibold">Suggested for you</h2>
          <NuxtLink to="/discover/people" class="text-xs text-pixl-accent hover:text-pixl-accent-2">See all</NuxtLink>
        </div>
        <p class="mb-3 text-sm text-pixl-muted">Discover accounts and posts you may like.</p>
        <UiButton variant="secondary" block @click="navigateTo('/discover/people')">Discover people</UiButton>
      </section>

      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-pixl-cyan" />
            <h2 class="text-sm font-semibold">Live</h2>
          </div>
          <NuxtLink to="/live" class="text-xs text-pixl-accent hover:text-pixl-accent-2">See all</NuxtLink>
        </div>
        <ul v-if="lives.length" class="mb-3 space-y-2">
          <li v-for="item in lives.slice(0, 3)" :key="item.id">
            <NuxtLink :to="liveApi.livePath(item, user)" class="flex items-center gap-2">
              <UiAvatar :src="item.user?.profilePic" :alt="item.user?.userName" :size="32" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ item.title }}</p>
                <p class="truncate text-xs text-pixl-muted">@{{ item.user?.userName }}</p>
              </div>
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="mb-3 text-sm text-pixl-muted">Go live and share a moment.</p>
        <UiButton variant="secondary" block @click="navigateTo('/live')">Go live</UiButton>
      </section>
    </div>
  </aside>
</template>

<script setup>
const { items, loading, refresh, approveRequest } = useRequests()
const { user } = useAuth()
const liveApi = useLivestream()
const lives = ref([])

onMounted(() => {
  refresh()
  liveApi.list().then((rows) => {
    lives.value = rows
  }).catch(() => {
    lives.value = []
  })
})

function requesterName(row) {
  return row?.user?.userName || row?.requesterUsername || 'User'
}
</script>
