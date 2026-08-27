<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4">
      <TransitionGroup name="page">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto mb-2 max-w-sm rounded-full px-4 py-2 text-sm shadow-pixl"
          :class="t.type === 'error' ? 'bg-pixl-danger text-white' : t.type === 'success' ? 'bg-pixl-success text-black' : 'glass-nav text-pixl-text ring-1 ring-white/10'"
        >
          {{ t.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
const { toasts } = useToast()
</script>
