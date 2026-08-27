<template>
  <div class="flex flex-1 flex-col items-center justify-center bg-black/50 p-8 text-center">
    <p class="text-lg font-semibold">Live ended</p>
    <p class="mt-2 text-sm text-pixl-muted">This stream is no longer available.</p>
    <UiButton class="mt-6" @click="navigateTo('/')">Back to feed</UiButton>
  </div>
</template>
