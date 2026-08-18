<script setup>
definePageMeta({ middleware: 'auth', hideBottomNav: true, hideHeader: true })

const route = useRoute()
const api = usePixlApi()
const toast = useToast()
const runtimeConfig = useRuntimeConfig()

const liveId = computed(() => String(route.params.liveId || ''))
const isHost = computed(() => route.query.host === '1')

const stream = ref(null)
const comments = ref([])
const text = ref('')
const sending = ref(false)
const ending = ref(false)

async function loadStream() {
  try {
    stream.value = await api.request(`/live/${encodeURIComponent(liveId.value)}`)
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Live not found'))
  }
}

async function loadComments() {
  try {
    const res = await api.request(`/live/${encodeURIComponent(liveId.value)}/comments`)
    comments.value = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
  } catch {
    // ignore poll errors
  }
}

onMounted(async () => {
  await loadStream()
  if (!isHost.value) {
    try {
      await api.request(`/live/${encodeURIComponent(liveId.value)}/join`, { method: 'POST' })
    } catch {
      // ignore
    }
  }
  await loadComments()
})

let poll
onMounted(() => {
  poll = setInterval(loadComments, 2000)
})

onBeforeUnmount(async () => {
  if (poll) clearInterval(poll)
  if (!isHost.value) {
    try {
      await api.request(`/live/${encodeURIComponent(liveId.value)}/leave`, { method: 'POST' })
    } catch {
      // ignore
    }
  }
})

async function sendComment() {
  const t = text.value.trim()
  if (!t || sending.value) return
  sending.value = true
  try {
    await api.request(`/live/${encodeURIComponent(liveId.value)}/comment`, {
      method: 'POST',
      body: { text: t },
    })
    text.value = ''
    await loadComments()
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not comment'))
  } finally {
    sending.value = false
  }
}

async function endLive() {
  ending.value = true
  try {
    await api.request(`/live/${encodeURIComponent(liveId.value)}`, { method: 'DELETE' })
    await navigateTo('/')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not end live'))
  } finally {
    ending.value = false
  }
}

const viewerCount = computed(() => {
  const v = stream.value?.viewers
  return Array.isArray(v) ? v.length : 0
})

const wsHint = computed(() => {
  const base = runtimeConfig.public.liveWsBase || 'ws://localhost:9090'
  return `${base}/live/${liveId.value}`
})
</script>

<template>
  <div class="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col gap-4 px-4 py-4 lg:flex-row">
    <div class="flex min-h-[50vh] flex-1 flex-col overflow-hidden rounded-card bg-pixl-card ring-1 ring-white/6">
      <div class="flex items-center justify-between px-4 py-3">
        <button type="button" class="text-sm text-pixl-muted" @click="navigateTo('/live')">Leave</button>
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full bg-pixl-danger" />
          <span class="text-xs font-semibold uppercase tracking-wider text-pixl-cyan">Live</span>
        </div>
        <UiButton v-if="isHost" size="sm" variant="danger" :loading="ending" @click="endLive">End</UiButton>
        <span v-else />
      </div>
      <div class="flex flex-1 flex-col items-center justify-center bg-black/40 p-8 text-center">
        <p class="text-lg font-semibold">{{ stream?.title || 'Live room' }}</p>
        <p class="mt-2 text-sm text-pixl-muted">Waiting for stream</p>
        <p class="mt-1 text-xs text-pixl-tertiary">{{ viewerCount }} watching · {{ liveId }}</p>
        <p class="mt-4 max-w-md break-all text-[11px] text-pixl-tertiary">{{ wsHint }}</p>
      </div>
    </div>

    <aside class="flex h-[40vh] w-full flex-col rounded-card bg-pixl-card ring-1 ring-white/6 lg:h-auto lg:w-80">
      <div class="border-b border-white/6 px-4 py-3 text-sm font-semibold">Comments</div>
      <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        <p v-if="!comments.length" class="text-sm text-pixl-muted">No comments yet.</p>
        <p v-for="(c, i) in comments" :key="c.id || i" class="text-sm">
          {{ c.text || c.message || JSON.stringify(c) }}
        </p>
      </div>
      <form class="flex gap-2 border-t border-white/6 p-3" @submit.prevent="sendComment">
        <input v-model="text" class="h-10 flex-1 rounded-full border border-white/8 bg-pixl-elevated px-3 text-sm" placeholder="Say something" />
        <UiButton type="submit" size="sm" :loading="sending">Send</UiButton>
      </form>
    </aside>
  </div>
</template>
