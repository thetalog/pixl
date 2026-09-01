<template>
  <UiModal :open="open" title="Report" @close="$emit('close')">
    <div class="space-y-3">
      <label class="block text-sm">
        <span class="mb-1.5 block text-pixl-muted">Category</span>
        <select v-model="category" class="h-10 w-full rounded-control border border-white/8 bg-pixl-elevated px-3">
          <option v-for="c in categories" :key="c" :value="c">{{ c.replace('_', ' ') }}</option>
        </select>
      </label>
      <UiTextField v-model="reason" label="What's wrong?" multiline />
    </div>
    <div class="mt-5 flex justify-end gap-2">
      <UiButton variant="tertiary" @click="$emit('close')">Cancel</UiButton>
      <UiButton :disabled="reason.trim().length < 3" :loading="loading" @click="submit">Submit report</UiButton>
    </div>
  </UiModal>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  targetType: { type: String, required: true },
  targetId: { type: String, required: true },
})
const emit = defineEmits(['close', 'submitted'])
const api = usePixlApi()
const toast = useToast()
const categories = ['spam', 'harassment', 'hate', 'violence', 'sexual_content', 'self_harm', 'impersonation', 'copyright', 'scam', 'fraud', 'misinformation', 'other']
const category = ref('spam')
const reason = ref('')
const loading = ref(false)

async function submit() {
  loading.value = true
  try {
    await api.request('/reports', {
      method: 'POST',
      body: { targetType: props.targetType, targetId: props.targetId, category: category.value, reason: reason.value },
    })
    toast.success('Report submitted')
    emit('submitted')
    emit('close')
    reason.value = ''
  } catch (error) {
    toast.error(error?.data?.message || 'Could not submit report')
  } finally {
    loading.value = false
  }
}
</script>
