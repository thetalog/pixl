<template>
  <label class="block">
    <span v-if="label" class="mb-1.5 block text-sm font-medium text-pixl-muted">{{ label }}</span>
    <component
      :is="multiline ? 'textarea' : 'input'"
      :value="modelValue"
      :type="multiline ? undefined : type"
      :rows="multiline ? rows : undefined"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      class="w-full rounded-control border border-white/8 bg-pixl-elevated px-3 text-pixl-text placeholder:text-pixl-tertiary transition duration-200 focus:border-pixl-accent/60 focus:ring-2 focus:ring-pixl-accent/40 disabled:opacity-50"
      :class="multiline ? 'min-h-[96px] py-2.5' : 'h-10'"
      v-bind="$attrs"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span v-if="hint" class="mt-1 block text-xs" :class="hintDanger ? 'text-pixl-danger' : 'text-pixl-tertiary'">
      {{ hint }}
    </span>
  </label>
</template>

<script setup>
defineOptions({ inheritAttrs: false })
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  disabled: { type: Boolean, default: false },
  multiline: { type: Boolean, default: false },
  rows: { type: Number, default: 3 },
  hint: { type: String, default: '' },
  hintDanger: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>
