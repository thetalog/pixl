<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to || undefined"
    class="relative inline-flex shrink-0"
    :class="sizeClass"
  >
    <span
      v-if="live"
      class="pointer-events-none absolute -inset-[3px] rounded-full live-ring"
    />
    <span
      v-else-if="story === 'unseen' || story === 'seen'"
      class="pointer-events-none absolute -inset-[3px] rounded-full"
      :class="story === 'unseen' ? 'story-ring-unseen' : 'bg-white/20'"
    />
    <span class="relative h-full w-full overflow-hidden rounded-full bg-pixl-card ring-1 ring-white/10">
      <img
        v-if="src && normalizeUrl(src)"
        :src="normalizeUrl(src)"
        :alt="alt"
        class="h-full w-full object-cover"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="($event) => { $event.target.style.display = 'none' }"
      />
      <span v-else class="flex h-full w-full items-center justify-center text-pixl-muted">
        <UiIcon name="user" :size="iconSize" />
      </span>
    </span>
    <span
      v-if="live"
      class="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full bg-pixl-danger px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white"
    >
      Live
    </span>
  </component>
</template>

<script setup>
const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: [Number, String], default: 40 },
  story: { type: String, default: 'none' },
  live: { type: Boolean, default: false },
  to: { type: String, default: '' },
})

const sizeClass = computed(() => {
  const n = Number(props.size)
  if (n === 32) return 'h-8 w-8'
  if (n === 40) return 'h-10 w-10'
  if (n === 56) return 'h-14 w-14'
  if (n === 88) return 'h-[88px] w-[88px]'
  return 'h-10 w-10'
})

const iconSize = computed(() => Math.max(14, Number(props.size) * 0.45))
</script>
