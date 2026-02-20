<template>
    <div class="min-h-screen">
        <div class="pb-24">
            <slot />
        </div>

        <div class="fixed bottom-0 z-50 flex w-full flex-row justify-around bg-black p-4 text-white">
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
    </div>
</template>
