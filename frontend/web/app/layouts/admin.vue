<template>
  <div class="min-h-screen bg-pixl-bg text-pixl-text">
    <AdminImpersonationBanner />
    <aside class="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-white/6 bg-pixl-bg/95 px-3 py-5 lg:flex">
      <NuxtLink to="/admin" class="mb-6 flex items-center gap-2 px-2">
        <img src="/logo.png" alt="" width="32" height="32" class="h-8 w-8 rounded-xl" />
        <span class="text-sm font-semibold tracking-tight">
          {{ isModeratorOnly ? 'Moderation' : 'Admin' }}
        </span>
      </NuxtLink>
      <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="rounded-control px-3 py-2 text-sm text-pixl-muted hover:bg-white/6 hover:text-pixl-text"
          :class="isActive(item.to) ? 'bg-white/8 text-pixl-text' : ''"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
      <NuxtLink to="/" class="mt-4 rounded-control px-3 py-2 text-sm text-pixl-muted hover:bg-white/6 hover:text-pixl-text">
        Back to Pixl
      </NuxtLink>
    </aside>

    <div class="lg:pl-[220px]">
      <header class="sticky top-0 z-30 flex items-center justify-between border-b border-white/6 bg-pixl-bg/90 px-4 py-3 backdrop-blur lg:hidden">
        <span class="font-semibold">{{ isModeratorOnly ? 'Moderation' : 'Admin' }}</span>
        <NuxtLink to="/" class="text-sm text-pixl-muted">App</NuxtLink>
      </header>
      <nav class="flex gap-2 overflow-x-auto border-b border-white/6 px-3 py-2 lg:hidden">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="shrink-0 rounded-full px-3 py-1 text-xs text-pixl-muted ring-1 ring-white/8"
          :class="isActive(item.to) ? 'bg-white/10 text-pixl-text' : ''"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
      <main class="min-h-screen p-4 sm:p-6">
        <slot />
      </main>
    </div>
    <UiToastHost />
  </div>
</template>

<script setup>
const route = useRoute()
const { canAny, capabilities } = useAdmin()

const isModeratorOnly = computed(() => {
  const key = capabilities.value?.roleKey
  return key === 'MODERATOR' || key === 'SUPPORT'
})

const allItems = computed(() => [
  { to: '/admin', label: 'Dashboard', perms: ['analytics.read', 'moderation.read', 'users.read'] },
  { to: '/admin/users', label: 'Users', perms: ['users.read', 'users.search'] },
  { to: '/admin/moderation', label: 'Moderation', perms: ['moderation.read'] },
  { to: '/admin/reports', label: 'Reports', perms: ['reports.read'] },
  { to: '/admin/content', label: 'Content', perms: ['content.read'] },
  { to: '/admin/comments', label: 'Comments', perms: ['comments.read'] },
  { to: '/admin/livestreams', label: 'Livestreams', perms: ['livestreams.read'] },
  { to: '/admin/appeals', label: 'Appeals', perms: ['moderation.appeal'] },
  { to: '/admin/support', label: 'Support', perms: ['support.read'] },
  { to: '/admin/notifications', label: 'Notifications', perms: ['notifications.read'] },
  { to: '/admin/analytics', label: 'Analytics', perms: ['analytics.read'] },
  { to: '/admin/audit', label: 'Audit logs', perms: ['audit.read'] },
  { to: '/admin/staff', label: 'Staff', perms: ['admins.read', 'moderators.read'] },
  { to: '/admin/roles', label: 'Roles', perms: ['admins.read'] },
  { to: '/admin/system', label: 'System', perms: ['system.read'] },
  { to: '/admin/flags', label: 'Feature flags', perms: ['feature_flags.read'] },
  { to: '/admin/settings', label: 'Settings', perms: ['settings.read'] },
])

const items = computed(() => allItems.value.filter((item) => canAny(...item.perms)))

function isActive(to) {
  if (to === '/admin') return route.path === '/admin'
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>
