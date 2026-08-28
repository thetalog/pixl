<template>
  <video
    ref="el"
    class="absolute inset-0 h-full w-full bg-black object-cover"
    :class="mirror ? 'scale-x-[-1]' : ''"
    playsinline
    autoplay
    muted
  />
</template>

<script setup>
const props = defineProps({
  stream: { default: null },
  muted: { type: Boolean, default: true },
  mirror: { type: Boolean, default: false },
})

const emit = defineEmits(['audible'])

const el = ref(null)

function report(video) {
  emit('audible', Boolean(video) && !video.muted && !video.paused)
}

/** Must run inside a user gesture: autoplay policies reject audible playback otherwise. */
async function enableAudio() {
  const video = el.value
  if (!video?.srcObject || props.muted) return false
  video.muted = false
  video.volume = 1
  try {
    await video.play()
  } catch {
    video.muted = true
    video.play().catch(() => {})
  }
  report(video)
  return !video.muted && !video.paused
}

async function attach(stream) {
  const video = el.value
  if (!video) return
  if (video.srcObject !== stream) {
    video.srcObject = stream || null
  }
  if (!stream) {
    emit('audible', false)
    return
  }
  video.playsInline = true
  video.muted = true
  try {
    await video.play()
  } catch {
    return
  }
  await enableAudio()
}

watch(
  [() => props.stream, el],
  ([stream]) => attach(stream),
  { immediate: true, flush: 'post' }
)

watch(() => props.muted, () => attach(props.stream))

onMounted(() => attach(props.stream))

defineExpose({ enableAudio })
</script>
