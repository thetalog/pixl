<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-white/6 glass-nav">
    <div class="flex h-[64px] items-center justify-around px-2">
      <NuxtLink
        v-for="item in tabs"
        :key="item.label"
        :to="item.to"
        class="relative flex h-12 w-12 items-center justify-center rounded-full text-pixl-muted transition duration-200"
        :class="isActive(item) ? 'text-pixl-text' : 'hover:text-pixl-text'"
        :aria-label="item.label"
      >
        <span
          v-if="item.emphasize"
          class="grid h-11 w-11 place-items-center rounded-full bg-pixl-accent text-white shadow-pixl"
        >
          <UiIcon name="plus" :size="22" />
        </span>
        <UiIcon v-else :name="item.icon" :filled="isActive(item)" :size="22" />
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup>
const route = useRoute()
const { tabs } = useNav()

function isActive(item) {
  if (item.emphasize) return route.path === '/create'
  if (item.matchPrefix && route.path.startsWith(item.matchPrefix)) return true
  if (item.to === '/') return route.path === '/'
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}
</script>
