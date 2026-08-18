<template>
  <div
    class="shimmer rounded-control"
    :class="[rounded, block ? 'w-full' : '']"
    :style="{ height: height || undefined, width: width || undefined }"
  />
</template>

<script setup>
defineProps({
  height: { type: String, default: '12px' },
  width: { type: String, default: '' },
  rounded: { type: String, default: 'rounded-control' },
  block: { type: Boolean, default: true },
})
</script>
