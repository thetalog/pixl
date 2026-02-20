<template>
        <div class="flex fixed bottom-0 flex-row justify-around bg-black text-white p-4 w-full">
                <span class="flex-auto text-center">
                    <NuxtLink to="/">Feed</NuxtLink>
                </span>
                <span class="flex-auto text-center">
                    <NuxtLink to="/">Message</NuxtLink>
                </span>
                <span class="flex-auto text-center">
                    <NuxtLink to="/">Explore</NuxtLink>
                </span>
                <span class="flex-auto text-center">
                    <NuxtLink to="/">Profile</NuxtLink>
                </span>
        </div>
    <slot />
</template>
