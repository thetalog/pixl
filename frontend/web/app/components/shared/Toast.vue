<template>
  <div v-if="visible" class="fixed top-4 right-4 bg-secondary rounded-lg p-4 shadow-lg flex gap-3 max-w-sm z-50 animate-pulse">
    <div :class="['w-1 h-full rounded-full', typeColor]"></div>
    <div class="flex-1">
      <p class="font-semibold">{{ title }}</p>
      <p class="text-sm text-gray-300">{{ message }}</p>
    </div>
    <button @click="$emit('close')" class="text-gray-400 hover:text-white">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  title: String,
  message: String,
  type: {
    type: String,
    default: 'info', // info, success, error, warning
    validator: (v) => ['info', 'success', 'error', 'warning'].includes(v)
  }
})

defineEmits(['close'])

const typeColor = computed(() => {
  const colors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500'
  }
  return colors[props.type as keyof typeof colors]
})
</script>
