<template>
  <button
    type="button"
    class="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl hover:bg-white/16"
    @click="$emit('react', 'LIKE')"
  >
    ♥
  </button>
</template>

<script setup>
defineEmits(['react'])
</script>
