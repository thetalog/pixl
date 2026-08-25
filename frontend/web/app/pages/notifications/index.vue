<script setup>
definePageMeta({ middleware: 'auth' })

const { items: requests, loading: requestsLoading, refresh: refreshRequests, approveRequest, rejectRequest } =
  useRequests()
const {
  items: notifications,
  loading: notifLoading,
  refresh: refreshNotifications,
  markRead,
  unreadCount,
} = useNotifications()

onMounted(async () => {
  await Promise.all([refreshRequests(), refreshNotifications()])
  if (unreadCount.value > 0) {
    await markRead()
  }
})

function nameOf(row) {
  return row?.user?.name || row?.user?.userName || row?.requesterUsername || 'Someone'
}
function handleOf(row) {
  return row?.user?.userName || row?.requesterUsername || ''
}

function typeLabel(type) {
  const t = String(type || '').toLowerCase()
  if (t === 'moderation') return 'Content blocked'
  if (t === 'mention') return 'Mention'
  if (t === 'like') return 'Like'
  if (t === 'comment') return 'Comment'
  return 'Update'
}

function formatWhen(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

const loading = computed(() => (requestsLoading.value || notifLoading.value) && !requests.value.length && !notifications.value.length)
</script>

<template>
  <div class="mx-auto w-full max-w-lg px-4 py-8">
    <h1 class="text-2xl font-semibold tracking-tight">Activity</h1>
    <p class="mt-1 text-sm text-pixl-muted">Moderation alerts and follow requests.</p>

    <div v-if="loading" class="mt-6 space-y-3">
      <UiSkeleton v-for="n in 4" :key="n" height="64px" rounded="rounded-card" />
    </div>

    <template v-else>
      <section class="mt-8">
        <h2 class="text-sm font-semibold text-pixl-muted">Alerts</h2>
        <UiEmptyState
          v-if="notifications.length === 0"
          class="!py-10"
          title="No alerts yet. Blocked uploads will show up here."
        />
        <ul v-else class="mt-3 space-y-3">
          <li
            v-for="n in notifications"
            :key="n.id"
            class="rounded-card bg-pixl-card p-3 ring-1 ring-white/6"
            :class="n.read ? 'opacity-80' : 'ring-pixl-accent/40'"
          >
            <div class="flex items-start gap-3">
              <span
                class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full"
                :class="n.type === 'moderation' ? 'bg-pixl-danger/15 text-pixl-danger' : 'bg-white/8 text-pixl-text'"
              >
                <UiIcon name="heart" :size="16" filled />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold uppercase tracking-wide text-pixl-tertiary">
                  {{ typeLabel(n.type) }}
                </p>
                <p class="mt-0.5 text-sm text-pixl-text">{{ n.message }}</p>
                <p class="mt-1 text-xs text-pixl-tertiary">{{ formatWhen(n.createdAt) }}</p>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <section class="mt-10">
        <h2 class="text-sm font-semibold text-pixl-muted">Follow requests</h2>
        <UiEmptyState
          v-if="requests.length === 0"
          class="!py-10"
          title="No follow requests right now."
          cta="Find people"
          @action="navigateTo('/search')"
        />
        <ul v-else class="mt-3 space-y-3">
          <li
            v-for="row in requests"
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
      </section>
    </template>
  </div>
</template>
