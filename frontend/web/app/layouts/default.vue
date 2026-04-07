<template>
    <div class="flex justify-center items-center scrollbar-hide min-h-max flex-col min-w-8">
          <!-- Header (Flutter-like AppBar) -->
    <div class="fixed top-0 flex items-center justify-between bg-black px-4 py-3 text-white min-w-full">
      <div class="truncate text-base font-semibold">Hi, {{ myTitle }}</div>
      
    </div>
    <div class="h-12"></div>
            <slot />
        </div>
        
        <div class="fixed bottom-0 z-50 flex w-full flex-row justify-around bg-black p-4 text-white min-w-0 ">
            <span class="flex-auto text-center">
                <NuxtLink to="/">Feed</NuxtLink>
            </span>
            <span class="flex-auto text-center">
                <NuxtLink to="/messages">Message</NuxtLink>
            </span>
            <span class="flex-auto text-center">
                <NuxtLink to="/explore">Explore</NuxtLink>
            </span>
            <span class="flex-auto text-center">
                <NuxtLink to="/">Profile</NuxtLink>
            </span>
        </div>
</template>

<script setup lang="js">
const api = usePixlApi()

const profileUsernameCookie = useCookie('profile_username', { sameSite: 'lax', path: '/' })
const { user } = useAuth()

const myTitle = computed(() => {
  const u = profileUsernameCookie.value || user.value?.userName
  return typeof u === 'string' && u.trim() ? u.trim() : 'Messages'
})
</script>