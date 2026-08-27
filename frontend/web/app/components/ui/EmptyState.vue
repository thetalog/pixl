<template>
  <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
    <p class="max-w-sm text-sm text-pixl-muted">{{ title }}</p>
    <UiButton v-if="cta" class="mt-4" :variant="variant" @click="$emit('action')">
      {{ cta }}
    </UiButton>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Nothing here yet.' },
  cta: { type: String, default: '' },
  variant: { type: String, default: 'primary' },
})
defineEmits(['action'])
</script>
