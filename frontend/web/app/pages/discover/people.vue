<script setup>
definePageMeta({ middleware: 'auth' })

const api = usePixlApi()

const dismissed = ref(new Set())

const { data: response, pending, error, refresh } = await useAsyncData(
  'discover-people',
  () => api.request('/users/suggested', { query: { take: '30' } }),
  { server: false }
)

const users = computed(() => {
  const value = response.value
  const list = Array.isArray(value?.data) ? value.data : Array.isArray(value) ? value : []
  return list.filter((u) => u?.id && !dismissed.value.has(u.id))
})

function dismiss(id) {
  dismissed.value = new Set([...dismissed.value, id])
}

function onFollowChange(user, { isFollow, isRequested }) {
  if (isFollow || isRequested) dismiss(user.id)
}
</script>

<template>
  <div class="mx-auto w-full max-w-[640px] px-4 py-6">
    <header class="mb-6 flex items-center gap-3">
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/6"
        aria-label="Back"
        @click="navigateTo('/')"
      >
        <UiIcon name="back" :size="20" />
      </button>
      <h1 class="text-lg font-semibold">Discover people</h1>
    </header>

    <div v-if="pending" class="space-y-4">
      <UiSkeleton v-for="n in 6" :key="n" height="72px" rounded="rounded-card" />
    </div>

    <UiEmptyState
      v-else-if="error"
      title="Couldn’t load suggestions."
      cta="Retry"
      @action="refresh"
    />

    <UiEmptyState
      v-else-if="users.length === 0"
      title="No suggestions right now."
      cta="Search people"
      @action="navigateTo('/search')"
    />

    <ul v-else class="divide-y divide-white/6 overflow-hidden rounded-card bg-pixl-card ring-1 ring-white/6">
      <li v-for="user in users" :key="user.id" class="flex items-center gap-3 px-4 py-3">
        <NuxtLink :to="`/profile/${user.userName}`" class="flex min-w-0 flex-1 items-center gap-3">
          <UiAvatar :src="user.profilePic" :alt="user.userName" :size="44" />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">{{ user.userName }}</p>
            <p class="truncate text-xs text-pixl-muted">{{ user.reason || 'Suggested for you' }}</p>
          </div>
        </NuxtLink>

        <UiFollowButton :username="user.userName" size="sm" @change="onFollowChange(user, $event)" />

        <button
          type="button"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-pixl-muted hover:bg-white/6 hover:text-pixl-text"
          aria-label="Dismiss"
          @click="dismiss(user.id)"
        >
          <UiIcon name="close" :size="16" />
        </button>
      </li>
    </ul>
  </div>
</template>
