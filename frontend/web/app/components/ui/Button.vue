<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 font-semibold transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-50"
    :class="[variantClass, sizeClass, block ? 'w-full' : '']"
    v-bind="$attrs"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-white/8 text-pixl-text hover:bg-white/12'
    case 'tertiary':
      return 'bg-transparent text-pixl-muted hover:text-pixl-text'
    case 'danger':
      return 'bg-pixl-danger text-white hover:bg-[#fb7185]'
    case 'ghost':
      return 'bg-transparent text-pixl-text hover:bg-white/6'
    default:
      return 'bg-pixl-accent text-white hover:bg-pixl-accent-2'
  }
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-9 rounded-control px-3 text-sm'
    case 'lg':
      return 'h-11 rounded-control px-4 text-sm'
    default:
      return 'h-10 rounded-control px-3.5 text-sm'
  }
})
</script>
