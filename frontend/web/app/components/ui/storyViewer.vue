<template>
  <div
    class="fixed inset-0 z-50 bg-black touch-none"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <div class="h-full w-full">
      <div class="flex h-full flex-col">
        <!-- Top header (like Android) -->
        <div class="flex items-center gap-3 px-4 pt-4 text-white">
          <button type="button" class="inline-flex items-center" aria-label="Back" @click="$emit('close')">
            <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                d="M15 18 9 12l6-6"
              />
            </svg>
          </button>

          <div class="h-10 w-10 overflow-hidden rounded-full bg-gray-700">
            <img
              v-if="currentUser.profilePic"
              :src="currentUser.profilePic"
              alt=""
              class="h-full w-full object-cover"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <div v-else class="flex h-full w-full items-center justify-center">
              <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                />
              </svg>
            </div>
          </div>

          <div class="min-w-0 flex-1">
            <div class="truncate text-lg font-semibold">{{ currentUser.userName }}</div>
          </div>
        </div>

        <!-- Media -->
        <div class="flex min-h-0 flex-1 items-center justify-center px-0 pb-6 pt-4">
          <img
            v-if="mediaUrl"
            :src="mediaUrl"
            alt=""
            class="h-full w-full select-none object-contain"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="js">
const emit = defineEmits(['close', 'update:index'])

const props = defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
  index: {
    type: Number,
    required: true,
  },
})

const api = usePixlApi()

const currentGroup = computed(() => props.groups?.[props.index] || null)

const currentUser = computed(() => {
  const g = currentGroup.value
  return {
    userName: g?.userName || 'User',
    profilePic: g?.profilePic || '',
  }
})

const currentStory = computed(() => {
  const g = currentGroup.value
  const stories = Array.isArray(g?.stories) ? g.stories : []
  return stories[0] || null
})

const mediaUrl = computed(() => {
  const s = currentStory.value
  const m = s?.media
  if (!m) return ''
  const mimeType = (m?.mimeType || '').toString()
  if (mimeType === 'VIDEO') return m.thumbnail || m.url || ''
  return m.url || ''
})

watch(
  () => currentStory.value?.id,
  async (storyId) => {
    if (!storyId) return
    try {
      await api.request('/posts/seen-stories', {
        method: 'POST',
        query: { storyId: storyId.toString() },
      })
    } catch {
      // ignore
    }
  },
  { immediate: true }
)

let swipeStart = null
let swipeLast = null

function onPointerDown(e) {
  swipeStart = { x: e.clientX, y: e.clientY }
  swipeLast = { x: e.clientX, y: e.clientY }
}

function onPointerMove(e) {
  if (!swipeStart) return
  swipeLast = { x: e.clientX, y: e.clientY }
}

function onPointerUp() {
  const start = swipeStart
  const end = swipeLast
  swipeStart = null
  swipeLast = null
  if (!start || !end) return

  const dx = end.x - start.x
  const dy = end.y - start.y

  // Requirement: swipe RIGHT moves to NEXT user.
  if (dx > 120 && Math.abs(dx) > Math.abs(dy) * 2) {
    const nextIndex = props.index + 1
    if (nextIndex < (props.groups?.length || 0)) {
      emit('update:index', nextIndex)
    }
  }
}
</script>
