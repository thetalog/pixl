<template>
  <button
    type="button"
    class="inline-flex items-center gap-2 rounded-full bg-pixl-danger px-4 py-2 text-sm font-semibold text-white"
    @click="$emit('click')"
  >
    <span class="h-2 w-2 rounded-full bg-white" />
    Go live
  </button>
</template>

<script setup>
defineEmits(['click'])
</script>
