<template>
  <section class="bg-gray-900">
    <div class="mx-auto w-full max-w-md">
      <div class="h-[110px]">
        <div v-if="loading" class="flex h-full items-center justify-center text-sm text-white">
          Loading stories…
        </div>
        <div v-else-if="error" class="flex h-full items-center justify-center text-sm text-white">
          Failed to load stories.
        </div>
        <div
          v-else
          class="flex h-full items-start gap-4 overflow-x-auto px-3 py-3"
        >
          <div v-if="items.length === 0" class="flex h-full w-full items-center justify-center text-sm text-white">
            No stories available
          </div>

          <button
            v-for="item in items"
            v-else
            :key="item.userId"
            type="button"
            class="flex shrink-0 flex-col items-center"
            @click="$emit('select', item)"
          >
            <div
              class="h-[74px] w-[74px] rounded-full ring-2 ring-offset-2 ring-offset-gray-900"
              :class="item.isSeen ? 'ring-gray-500' : 'ring-white'"
            >
              <div class="h-full w-full overflow-hidden rounded-full bg-gray-700">
                <img
                  v-if="item.profilePic"
                  :src="item.profilePic"
                  alt=""
                  class="h-full w-full object-cover"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div class="mt-1 max-w-[84px] truncate text-center text-sm text-white">
              {{ item.userName || 'User' }}
            </div>
          </button>
        </div>
      </div>
      <div class="h-px w-full bg-gray-700" />
    </div>
  </section>
</template>

<script setup lang="js">
defineEmits(['select'])

const props = defineProps({
  stories: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: [Object, String, Boolean],
    default: null,
  },
})

const items = computed(() => {
  const list = Array.isArray(props.stories) ? props.stories : []

  const grouped = new Map()
  for (const story of list) {
    const user = story?.user
    const userId = (user?.id ?? story?.userId)?.toString?.() || user?.id || story?.userId
    if (!userId) continue

    const bucket = grouped.get(userId) || []
    bucket.push(story)
    grouped.set(userId, bucket)
  }

  const out = []
  for (const [userId, userStories] of grouped.entries()) {
    const first = userStories[0] || {}
    const user = first.user || {}
    const userName = user.userName || first.userName || ''
    const profilePic = user.profilePic || first.profilePic || ''
    const isSeen = userStories.every((s) => !!s?.isSeen)

    out.push({
      userId,
      userName,
      profilePic,
      isSeen,
      stories: userStories,
    })
  }

  return out
})
</script>
