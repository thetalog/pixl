<template>
  <div class="relative min-h-[50vh] w-full flex-1 overflow-hidden bg-black">
    <LivePreview :stream="stream" :muted="muted" :mirror="mirror" />
    <p
      v-if="!stream"
      class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-pixl-muted"
    >
      Waiting for camera…
    </p>
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
</script>
