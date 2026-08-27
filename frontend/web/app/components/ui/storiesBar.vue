<template>
  <section class="border-b border-white/6">
    <div class="h-[118px]">
      <div v-if="loading" class="flex h-full items-center gap-4 px-1">
        <UiSkeleton v-for="n in 6" :key="n" height="74px" width="74px" rounded="rounded-full" :block="false" />
      </div>
      <div v-else-if="error && !items.length" class="flex h-full items-center justify-center text-sm text-pixl-muted">
        Couldn’t load stories.
      </div>
      <div v-else class="flex h-full items-start gap-4 overflow-x-auto px-1 py-3 scrollbar-hide">
        <p v-if="items.length === 0" class="flex h-full w-full items-center justify-center text-sm text-pixl-muted">
          No stories yet.
        </p>
        <button
          v-for="item in items"
          v-else
          :key="item.key"
          type="button"
          class="flex shrink-0 flex-col items-center"
          @click="$emit('select', item)"
        >
          <span class="rounded-full p-[2px]" :class="item.liveId ? 'live-ring' : item.isSeen ? 'bg-white/20' : 'story-ring-unseen'">
            <span class="relative block rounded-full bg-pixl-bg p-[2px]">
              <UiAvatar :src="item.profilePic" :alt="item.userName" :size="56" />
              <span
                v-if="item.liveId"
                class="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-pixl-danger px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white"
              >
                Live
              </span>
            </span>
          </span>
          <span class="mt-1 max-w-[76px] truncate text-center text-xs text-pixl-muted">
            {{ item.userName || 'User' }}
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
defineEmits(['select'])

const props = defineProps({
  stories: { type: Array, default: () => [] },
  lives: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: [Object, String, Boolean], default: null },
})

const items = computed(() => {
  const liveUsers = new Set()
  const out = []

  for (const live of Array.isArray(props.lives) ? props.lives : []) {
    const user = live?.user || {}
    const userId = (user.id || live.userId || '').toString()
    const liveId = live.id
    if (!liveId) continue
    liveUsers.add(userId || user.userName)
    out.push({
      key: `live-${liveId}`,
      userId,
      userName: user.userName || live.hostUsername || '',
      profilePic: user.profilePic || live.hostAvatarUrl || '',
      liveId,
      isSeen: false,
      stories: [],
    })
  }

  const list = Array.isArray(props.stories) ? props.stories : []
  const grouped = new Map()
  for (const story of list) {
    const user = story?.user
    const userId = (user?.id ?? story?.userId)?.toString?.() || user?.id || story?.userId
    if (!userId) continue
    if (liveUsers.has(userId.toString()) || liveUsers.has(user?.userName)) continue
    const bucket = grouped.get(userId) || []
    bucket.push(story)
    grouped.set(userId, bucket)
  }
  for (const [userId, userStories] of grouped.entries()) {
    const first = userStories[0] || {}
    const user = first.user || {}
    out.push({
      key: `story-${userId}`,
      userId,
      userName: user.userName || first.userName || '',
      profilePic: user.profilePic || first.profilePic || '',
      isSeen: userStories.every((s) => !!s?.isSeen),
      stories: userStories,
    })
  }
  return out
})
</script>
