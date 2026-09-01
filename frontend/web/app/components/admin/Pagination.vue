<template>
  <div class="mt-4 flex items-center justify-between text-sm text-pixl-muted">
    <span>{{ total }} results</span>
    <div class="flex gap-2">
      <UiButton size="sm" variant="secondary" :disabled="page <= 1" @click="$emit('update:page', page - 1)">
        Previous
      </UiButton>
      <span class="grid h-9 place-items-center px-2">{{ page }} / {{ pages }}</span>
      <UiButton size="sm" variant="secondary" :disabled="page >= pages" @click="$emit('update:page', page + 1)">
        Next
      </UiButton>
    </div>
  </div>
</template>

<script setup>
defineProps({
  page: { type: Number, default: 1 },
  pages: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
})
defineEmits(['update:page'])
</script>
