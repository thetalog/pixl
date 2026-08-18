<template>
  <div class="fixed inset-0 z-[70] bg-black touch-none" @pointerdown="onPointerDown" @pointerup="onPointerUp">
    <div class="flex h-full flex-col">
      <div class="absolute inset-x-0 top-0 z-10 px-3 pt-3">
        <div class="mb-3 flex gap-1">
          <div v-for="(s, i) in currentStories" :key="s?.id || i" class="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              class="h-full bg-white"
              :style="{
                width: i < storyIndex ? '100%' : i > storyIndex ? '0%' : `${progress * 100}%`,
              }"
            />
          </div>
        </div>
        <div class="flex items-center gap-3 text-white">
          <button type="button" class="inline-flex h-10 w-10 items-center justify-center" aria-label="Close" @click="close">
            <UiIcon name="close" :size="20" />
          </button>
          <UiAvatar :src="currentUser.profilePic" :alt="currentUser.userName" :size="40" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-semibold">{{ currentUser.userName }}</div>
          </div>
        </div>
      </div>

      <div class="relative flex min-h-0 flex-1 items-center justify-center">
        <button type="button" class="absolute inset-y-0 left-0 z-10 w-1/3" aria-label="Previous" @click.stop="prev" />
        <button type="button" class="absolute inset-y-0 right-0 z-10 w-1/3" aria-label="Next" @click.stop="next" />

        <video
          v-if="isVideo && mediaSrc"
          :key="currentStory?.id || 'video'"
          ref="videoEl"
          :src="mediaSrc"
          class="h-full w-full object-contain"
          autoplay
          playsinline
          @ended="next"
          @loadedmetadata="onVideoMeta"
        />
        <img
          v-else-if="mediaSrc"
          :src="mediaSrc"
          alt=""
          class="h-full w-full select-none object-contain"
          referrerpolicy="no-referrer"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close', 'update:index'])

const props = defineProps({
  groups: { type: Array, default: () => [] },
  index: { type: Number, required: true },
})

const api = usePixlApi()
const { storyOpen } = useChrome()
const storyIndex = ref(0)
const progress = ref(0)
const videoEl = ref(null)
let timer = null
let startedAt = 0
let durationMs = 5000
const IMAGE_MS = 5000

const currentGroup = computed(() => props.groups?.[props.index] || null)
const currentStories = computed(() => {
  const list = Array.isArray(currentGroup.value?.stories) ? currentGroup.value.stories : []
  return [...list].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
})
const currentUser = computed(() => ({
  userName: currentGroup.value?.userName || 'User',
  profilePic: currentGroup.value?.profilePic || '',
}))
const currentStory = computed(() => currentStories.value[storyIndex.value] || null)
const isVideo = computed(() => isVideoMedia(currentStory.value?.media))
const mediaSrc = computed(() => {
  const m = currentStory.value?.media
  if (!m) return ''
  if (isVideo.value) return normalizeUrl(m.url)
  return previewUrl(m)
})

onMounted(() => {
  storyOpen.value = true
})
onBeforeUnmount(() => {
  storyOpen.value = false
  clearTimer()
})

watch(
  () => props.index,
  () => {
    storyIndex.value = 0
    startProgress()
  }
)

watch(
  () => currentStory.value?.id,
  async (storyId) => {
    if (!storyId) return
    startProgress()
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

function clearTimer() {
  if (timer) {
    cancelAnimationFrame(timer)
    timer = null
  }
}

function tick() {
  const elapsed = Date.now() - startedAt
  progress.value = Math.min(1, elapsed / durationMs)
  if (progress.value >= 1) {
    next()
    return
  }
  timer = requestAnimationFrame(tick)
}

function startProgress() {
  clearTimer()
  progress.value = 0
  durationMs = isVideo.value ? durationMs : IMAGE_MS
  startedAt = Date.now()
  timer = requestAnimationFrame(tick)
}

function onVideoMeta() {
  const d = videoEl.value?.duration
  if (d && Number.isFinite(d) && d > 0) {
    durationMs = d * 1000
    startProgress()
  }
}

function close() {
  emit('close')
}

function next() {
  if (storyIndex.value < currentStories.value.length - 1) {
    storyIndex.value += 1
    return
  }
  const nextGroup = props.index + 1
  if (nextGroup < (props.groups?.length || 0)) {
    emit('update:index', nextGroup)
    return
  }
  close()
}

function prev() {
  if (storyIndex.value > 0) {
    storyIndex.value -= 1
    return
  }
  const prevGroup = props.index - 1
  if (prevGroup >= 0) emit('update:index', prevGroup)
}

let pointerStart = null
function onPointerDown(e) {
  pointerStart = { x: e.clientX, y: e.clientY, t: Date.now() }
}
function onPointerUp(e) {
  const start = pointerStart
  pointerStart = null
  if (!start) return
  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    if (dx < 0) next()
    else prev()
  }
}
</script>
