<template>
  <div v-if="visible" class="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-secondary rounded-lg p-6 max-w-sm w-full mx-4">
      <div class="flex items-center gap-3">
        <div class="animate-spin">
          <svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p class="text-lg">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  message: {
    type: String,
    default: 'Loading...'
  }
})
</script>
