<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Page Title -->
    <h1 class="text-3xl font-bold mb-8 text-white">Home</h1>
    
    <p class="text-gray-300">Welcome to Pixl! This is the home page.</p>
  </div>
</template>

<script>
definePageMeta({
  layout: 'default',
  middleware: 'auth'
})
</script>
