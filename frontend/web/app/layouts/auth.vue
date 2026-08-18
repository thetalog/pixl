<template>
  <div class="min-h-screen bg-pixl-bg text-pixl-text">
    <div class="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(168,85,247,0.12),transparent_55%),radial-gradient(900px_500px_at_100%_0%,rgba(34,211,238,0.08),transparent_50%)]" />
    <div class="relative">
      <slot />
    </div>
    <UiToastHost />
  </div>
</template>
