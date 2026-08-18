<script setup>
const error = useError()
const is404 = computed(() => Number(error.value?.statusCode) === 404)

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-pixl-bg px-4 text-pixl-text">
    <div class="w-full max-w-md rounded-card bg-pixl-card p-6 text-center ring-1 ring-white/6">
      <p class="text-sm font-semibold text-pixl-accent">{{ error?.statusCode || 500 }}</p>
      <h1 class="mt-2 text-2xl font-semibold tracking-tight">
        {{ is404 ? 'Page not found' : 'Something went wrong' }}
      </h1>
      <p class="mt-2 text-sm text-pixl-muted">{{ error?.message || 'Please try again.' }}</p>
      <UiButton class="mt-6" block @click="goHome">Back to feed</UiButton>
    </div>
  </div>
</template>
