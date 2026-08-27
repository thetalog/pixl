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

const el = ref(null)

function attach(stream) {
  const video = el.value
  if (!video) return
  if (video.srcObject !== stream) {
    video.srcObject = stream || null
  }
  if (stream) {
    video.playsInline = true
    video.muted = true
    const play = video.play()
    const unmute = () => {
      if (!props.muted) video.muted = false
    }
    if (play?.then) {
      play.then(unmute).catch(() => {
        video.muted = true
      })
    } else {
      unmute()
    }
  }
}

watch(
  [() => props.stream, el],
  ([stream]) => attach(stream),
  { immediate: true, flush: 'post' }
)

onMounted(() => attach(props.stream))
</script>
