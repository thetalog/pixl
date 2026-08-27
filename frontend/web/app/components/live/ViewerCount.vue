<template>
  <span class="rounded-full bg-black/50 px-2 py-1 text-xs text-white">{{ count }} watching</span>
</template>

<script setup>
defineProps({
  count: { type: Number, default: 0 },
})
</script>
