<template>
  <span
    class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
    :class="toneClass"
  >
    {{ label }}
  </span>
</template>

<script setup>
const props = defineProps({
  value: { type: [String, Boolean], default: '' },
})
const label = computed(() => String(props.value || '—'))
const toneClass = computed(() => {
  const v = label.value.toUpperCase()
  if (['LIVE', 'ACTIVE', 'RESOLVED', 'SUCCESS', true, 'TRUE'].includes(v) || v === 'TRUE') return 'bg-pixl-success/15 text-pixl-success'
  if (['URGENT', 'BANNED', 'FAILED', 'DANGER'].includes(v)) return 'bg-pixl-danger/15 text-pixl-danger'
  if (['HIGH', 'ESCALATED', 'SUSPENDED', 'IN_REVIEW'].includes(v)) return 'bg-amber-400/15 text-amber-300'
  if (['NEW', 'PENDING'].includes(v)) return 'bg-pixl-cyan/15 text-pixl-cyan'
  return 'bg-white/8 text-pixl-muted'
})
</script>
