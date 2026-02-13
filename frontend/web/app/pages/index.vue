<template>
  <div class="flex items-center justify-center min-h-screen bg-primary">
    <p class="text-white">Redirecting...</p>
  </div>
</template>

<script setup lang="ts">
onMounted(() => {
  navigateTo('/home')
})
</script>
