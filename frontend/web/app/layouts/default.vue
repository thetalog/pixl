<template>
  <div class="min-h-screen bg-pixl-bg text-pixl-text">
    <NavAppSidebar class="hidden lg:flex" />

    <div class="lg:pl-[72px] xl:pl-[240px]">
      <NavAppHeader v-if="!hideHeader" class="lg:hidden" />
      <main
        class="min-h-screen"
        :class="hideBottomNav ? 'pb-0' : 'pb-24 lg:pb-0'"
      >
        <slot />
      </main>
    </div>

    <NavAppBottomNav v-if="!hideBottomNav" class="lg:hidden" />
    <UiToastHost />
  </div>
</template>

<script setup>
const { hideBottomNav, hideHeader } = useChrome()
</script>
