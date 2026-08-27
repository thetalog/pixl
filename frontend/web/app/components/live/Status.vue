<template>
  <div class="flex items-center gap-2 text-xs">
    <span class="h-2 w-2 rounded-full" :class="dotClass" />
    <span class="font-semibold uppercase tracking-wider" :class="labelClass">{{ label }}</span>
    <span class="text-pixl-tertiary">{{ connection }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  status: { type: String, default: 'CREATED' },
  connection: { type: String, default: '' },
})

const label = computed(() => {
  if (props.status === 'LIVE') return 'Live'
  if (props.status === 'ENDED') return 'Ended'
  if (props.status === 'STARTING') return 'Starting'
  if (props.status === 'FAILED') return 'Failed'
  return props.status || 'Ready'
})

const dotClass = computed(() => {
  if (props.status === 'LIVE') return 'bg-pixl-danger'
  if (props.status === 'ENDED') return 'bg-pixl-muted'
  return 'bg-pixl-cyan'
})

const labelClass = computed(() => (props.status === 'LIVE' ? 'text-pixl-cyan' : 'text-pixl-muted'))
</script>
