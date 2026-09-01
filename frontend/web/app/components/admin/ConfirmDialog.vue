<template>
  <UiModal :open="open" :title="title" @close="$emit('close')">
    <p class="text-sm text-pixl-muted">{{ message }}</p>
    <UiTextField
      v-if="requireReason"
      v-model="reason"
      class="mt-4"
      label="Reason"
      multiline
      :hint="danger ? 'This action is audited.' : ''"
    />
    <UiTextField
      v-if="confirmWord"
      v-model="typed"
      class="mt-3"
      :label="`Type ${confirmWord} to confirm`"
    />
    <div class="mt-5 flex justify-end gap-2">
      <UiButton variant="tertiary" @click="$emit('close')">Cancel</UiButton>
      <UiButton :variant="danger ? 'danger' : 'primary'" :disabled="!canConfirm" :loading="loading" @click="confirm">
        {{ confirmLabel }}
      </UiButton>
    </div>
  </UiModal>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  requireReason: { type: Boolean, default: true },
  confirmWord: { type: String, default: '' },
  danger: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'confirm'])
const reason = ref('')
const typed = ref('')
const canConfirm = computed(() => {
  if (props.requireReason && reason.value.trim().length < 3) return false
  if (props.confirmWord && typed.value !== props.confirmWord) return false
  return true
})
function confirm() {
  emit('confirm', { reason: reason.value.trim() })
}
watch(() => props.open, (open) => {
  if (!open) {
    reason.value = ''
    typed.value = ''
  }
})
</script>
