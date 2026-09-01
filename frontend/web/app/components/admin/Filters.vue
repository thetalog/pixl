<template>
  <div class="mb-4 flex flex-wrap items-end gap-3">
    <UiTextField v-model="local.q" class="min-w-[200px] flex-1" :placeholder="searchPlaceholder" @update:model-value="emit()" />
    <label v-for="filter in filters" :key="filter.key" class="block text-sm">
      <span class="mb-1.5 block text-pixl-muted">{{ filter.label }}</span>
      <select
        v-model="local[filter.key]"
        class="h-10 rounded-control border border-white/8 bg-pixl-elevated px-3 text-pixl-text"
        @change="emit()"
      >
        <option value="">All</option>
        <option v-for="opt in filter.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </label>
    <label v-if="dates" class="block text-sm">
      <span class="mb-1.5 block text-pixl-muted">From</span>
      <input v-model="local.from" type="date" class="h-10 rounded-control border border-white/8 bg-pixl-elevated px-3" @change="emit()" />
    </label>
    <label v-if="dates" class="block text-sm">
      <span class="mb-1.5 block text-pixl-muted">To</span>
      <input v-model="local.to" type="date" class="h-10 rounded-control border border-white/8 bg-pixl-elevated px-3" @change="emit()" />
    </label>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  filters: { type: Array, default: () => [] },
  searchPlaceholder: { type: String, default: 'Search' },
  dates: { type: Boolean, default: false },
})
const emitUpdate = defineEmits(['update:modelValue'])
const local = reactive({ q: '', from: '', to: '', ...props.modelValue })
let timer
function emit() {
  clearTimeout(timer)
  timer = setTimeout(() => emitUpdate('update:modelValue', { ...local }), 250)
}
watch(() => props.modelValue, (v) => Object.assign(local, v || {}), { deep: true })
</script>
