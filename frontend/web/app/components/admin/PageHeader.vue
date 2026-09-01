<template>
  <div class="mb-6">
    <p v-if="crumbs.length" class="mb-2 text-xs text-pixl-tertiary">
      <NuxtLink v-for="(c, i) in crumbs" :key="c.to" :to="c.to" class="hover:text-pixl-text">
        {{ c.label }}<span v-if="i < crumbs.length - 1"> / </span>
      </NuxtLink>
    </p>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 text-sm text-pixl-muted">{{ subtitle }}</p>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  crumbs: { type: Array, default: () => [] },
})
</script>
