<template>
  <div class="relative min-h-[50vh] w-full flex-1 overflow-hidden bg-black">
    <LivePreview
      ref="preview"
      :stream="stream"
      :muted="muted"
      :mirror="mirror"
      @audible="audible = $event"
    />
    <p
      v-if="!stream"
      class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-pixl-muted"
    >
      {{ muted ? 'Waiting for camera…' : 'Waiting for live video…' }}
    </p>
    <button
      v-if="stream && !muted && !audible"
      type="button"
      class="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white ring-1 ring-white/20 backdrop-blur"
      @click="preview?.enableAudio()"
    >
      Tap for sound
    </button>
    <div class="pointer-events-none absolute left-4 top-4">
      <slot name="badge" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  stream: { default: null },
  muted: { type: Boolean, default: true },
  mirror: { type: Boolean, default: false },
})

const preview = ref(null)
const audible = ref(false)
</script>
