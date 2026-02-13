<template>
  <div class="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-secondary rounded-lg p-6 max-w-sm w-full mx-4">
      <h2 v-if="title" class="text-xl font-bold mb-4">{{ title }}</h2>
      <div class="mb-6">
        <slot>{{ message }}</slot>
      </div>
      <div class="flex gap-3 justify-end">
        <button
          class="btn-secondary"
          @click="$emit('cancel')"
        >
          {{ cancelText }}
        </button>
        <button
          v-if="showConfirm"
          :class="[
            'btn-primary',
            { 'opacity-50 cursor-not-allowed': loading }
          ]"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          <span v-if="!loading">{{ confirmText }}</span>
          <span v-else>{{ loadingText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: String,
  message: String,
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  loadingText: {
    type: String,
    default: 'Loading...'
  },
  loading: Boolean,
  showConfirm: {
    type: Boolean,
    default: true
  }
})

defineEmits(['confirm', 'cancel'])
</script>
