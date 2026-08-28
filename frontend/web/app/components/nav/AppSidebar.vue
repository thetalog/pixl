<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-white/6 bg-pixl-bg/90 px-2 backdrop-blur-xl xl:w-[240px] xl:px-3 lg:flex"
  >
    <NuxtLink to="/" class="mt-5 mb-8 flex items-center gap-3 px-2" aria-label="Pixl home">
      <img src="/logo.png" alt="" width="40" height="40" class="h-10 w-10 rounded-2xl" />
      <span class="hidden text-xl font-semibold tracking-tight xl:inline">Pixl</span>
    </NuxtLink>

    <nav class="flex flex-1 flex-col gap-1">
      <NuxtLink
        v-for="item in sidebar"
        :key="item.label"
        :to="item.to"
        class="group relative flex items-center justify-center gap-3 rounded-control px-3 py-2.5 text-pixl-muted transition duration-200 hover:bg-white/6 hover:text-pixl-text xl:justify-start"
        :class="isActive(item) ? 'bg-white/8 text-pixl-text' : ''"
        :aria-label="item.label"
        :title="item.label"
      >
        <UiIcon :name="item.icon" :filled="isActive(item)" :size="22" />
        <span class="hidden text-sm font-medium xl:inline">{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="absolute right-1.5 top-1 grid min-w-5 place-items-center rounded-full bg-pixl-accent px-1 text-[10px] font-bold text-white xl:right-2 xl:top-auto"
        >
          {{ item.badge > 9 ? '9+' : item.badge }}
        </span>
      </NuxtLink>
    </nav>

    <div class="mb-4 px-1">
      <NuxtLink
        :to="profilePath"
        class="flex items-center justify-center gap-3 rounded-control px-2 py-2 text-left text-pixl-muted hover:bg-white/6 hover:text-pixl-text xl:justify-start"
      >
        <UiAvatar :src="user?.profilePic" :alt="myUsername" :size="40" />
        <span class="hidden min-w-0 xl:block">
          <span class="block truncate text-sm font-semibold text-pixl-text">{{ user?.name || myUsername }}</span>
          <span class="block truncate text-xs text-pixl-tertiary">@{{ myUsername }}</span>
        </span>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup>
const route = useRoute()
const { sidebar, profilePath } = useNav()
const { user, myUsername } = useAuth()

function isActive(item) {
  if (item.matchPrefix && route.path.startsWith(item.matchPrefix)) return true
  if (item.to === '/') return route.path === '/'
  return route.path === item.to || route.path.startsWith(`${item.to}/`)
}
</script>
