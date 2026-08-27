<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close dialog"
        @click="$emit('close')"
      />
      <div
        class="relative w-full max-w-md rounded-t-sheet bg-pixl-elevated p-5 shadow-pixl sm:mx-4 sm:rounded-card"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'modal-title' : undefined"
      >
        <div v-if="title || $slots.header" class="mb-4 flex items-center justify-between gap-3">
          <h2 id="modal-title" class="text-lg font-semibold tracking-tight">
            <slot name="header">{{ title }}</slot>
          </h2>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full text-pixl-muted hover:bg-white/6 hover:text-pixl-text"
            aria-label="Close"
            @click="$emit('close')"
          >
            <UiIcon name="close" :size="18" />
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
})
defineEmits(['close'])
</script>
