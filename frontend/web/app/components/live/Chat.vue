<template>
  <aside class="flex h-full min-h-0 w-full flex-col">
    <div class="border-b border-white/6 px-4 py-3 text-sm font-semibold">Comments</div>
    <div ref="scroller" class="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
      <p v-if="!comments.length" class="text-sm text-pixl-muted">No comments yet.</p>
      <div v-for="c in comments" :key="c.id" class="text-sm">
        <span class="font-semibold">{{ c.userName || 'user' }}</span>
        <span class="text-pixl-muted"> {{ c.text }}</span>
      </div>
    </div>
    <form class="flex gap-2 border-t border-white/6 p-3" @submit.prevent="submit">
      <input v-model="text" class="h-10 flex-1 rounded-full border border-white/8 bg-pixl-elevated px-3 text-sm" placeholder="Say something" maxlength="280" />
      <UiButton type="submit" size="sm" :loading="sending">Send</UiButton>
    </form>
  </aside>
</template>

<script setup>
const props = defineProps({
  comments: { type: Array, default: () => [] },
  sending: { type: Boolean, default: false },
})
const emit = defineEmits(['send'])
const text = ref('')
const scroller = ref(null)

function submit() {
  const value = text.value.trim()
  if (!value) return
  emit('send', value)
  text.value = ''
}

watch(
  () => props.comments.length,
  async () => {
    await nextTick()
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  }
)
</script>
