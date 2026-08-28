<template>
  <header class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/6 px-4 glass-nav">
    <NuxtLink to="/" class="flex items-center gap-2" aria-label="Pixl home">
      <img src="/logo.png" alt="" width="32" height="32" class="h-8 w-8 rounded-xl" />
      <span class="text-lg font-semibold tracking-tight">Pixl</span>
    </NuxtLink>

    <div class="flex items-center gap-1">
      <NuxtLink
        to="/create"
        class="inline-flex h-10 w-10 items-center justify-center rounded-full text-pixl-text hover:bg-white/8"
        aria-label="Create"
      >
        <UiIcon name="plus" :size="22" />
      </NuxtLink>
      <NuxtLink
        to="/messages"
        class="inline-flex h-10 w-10 items-center justify-center rounded-full text-pixl-text hover:bg-white/8"
        aria-label="Messages"
      >
        <UiIcon name="message" :size="22" />
      </NuxtLink>
      <NuxtLink
        to="/notifications"
        class="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-pixl-text hover:bg-white/8"
        aria-label="Activity"
      >
        <UiIcon name="heart" :size="22" />
        <span
          v-if="badgeCount"
          class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pixl-accent"
        />
      </NuxtLink>
    </div>
  </header>
</template>

<script setup>
const { count: requestCount, refresh: refreshRequests } = useRequests()
const { unreadCount, refresh: refreshNotifications } = useNotifications()

const badgeCount = computed(() => Number(requestCount.value || 0) + Number(unreadCount.value || 0))

onMounted(() => {
  refreshRequests()
  refreshNotifications()
})
</script>
