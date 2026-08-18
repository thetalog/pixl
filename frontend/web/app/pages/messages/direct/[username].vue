<script setup>
definePageMeta({ middleware: 'auth', hideBottomNav: true, hideHeader: true })

const route = useRoute()
const api = usePixlApi()
const toast = useToast()
const { myUsername } = useAuth()

const targetUsername = computed(() => String(route.params.username || ''))
const targetName = computed(() => String(route.query?.name || ''))
const targetProfilePic = computed(() => String(route.query?.pic || ''))

const loading = ref(true)
const sending = ref(false)
const error = ref('')
const messages = ref([])
const text = ref('')
const attachments = ref([])
const listRef = ref(null)
const fileInputRef = ref(null)
const actionSheetOpen = ref(false)
const actionSheetMessage = ref(null)

function isMine(m) {
  return (m?.sender?.userName || '') === myUsername.value
}

async function markSeenBestEffort() {
  try {
    await api.request('/message/direct/seen-direct-message', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: { senderUsername: targetUsername.value },
    })
  } catch {
    // best-effort
  }
}

async function reload(silent = false) {
  if (!silent) loading.value = true
  try {
    const res = await api.request('/message/direct/messages', {
      query: { targetUsername: targetUsername.value, skip: '0', take: '200' },
    })
    messages.value = Array.isArray(res?.messages) ? res.messages : []
    error.value = ''
  } catch (e) {
    if (!silent) error.value = apiErrorMessage(e, 'Failed to load messages')
  } finally {
    loading.value = false
  }
}

function scrollToBottom() {
  const el = listRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

async function bootstrap() {
  await markSeenBestEffort()
  await reload()
  await nextTick()
  scrollToBottom()
}

function pickAttachments() {
  if (sending.value) return
  fileInputRef.value?.click?.()
}

function onFilesSelected(e) {
  const files = Array.from(e?.target?.files || [])
  attachments.value = files.filter((f) => f instanceof File).map((file) => ({ file, url: URL.createObjectURL(file) }))
  e.target.value = ''
}

function removeAttachment(idx) {
  const item = attachments.value[idx]
  if (item?.url) URL.revokeObjectURL(item.url)
  attachments.value = attachments.value.filter((_, i) => i !== idx)
}

async function send() {
  if (sending.value) return
  const msg = text.value.trim()
  if (!msg && attachments.value.length === 0) return

  const optimistic = {
    id: `local-${Date.now()}`,
    message: msg || ' ',
    retracted: false,
    mediaUrl: attachments.value.map((a) => a.url),
    sender: { userName: myUsername.value },
    createdAt: new Date().toISOString(),
    reactions: [],
    _pending: true,
  }
  messages.value = [...messages.value, optimistic]
  const keepText = text.value
  const keepAtt = attachments.value
  text.value = ''
  attachments.value = []
  await nextTick()
  scrollToBottom()

  sending.value = true
  try {
    const form = new FormData()
    form.append('postData', JSON.stringify({ receiverUsername: targetUsername.value, message: msg ? msg : ' ' }))
    for (const a of keepAtt) {
      if (a?.file) form.append('files', a.file)
    }
    await api.request('/message/direct/send-message', { method: 'POST', body: form })
    for (const a of keepAtt) if (a?.url) URL.revokeObjectURL(a.url)
    await reload(true)
    await nextTick()
    scrollToBottom()
  } catch (e) {
    messages.value = messages.value.filter((m) => m.id !== optimistic.id)
    text.value = keepText
    attachments.value = keepAtt
    toast.error(apiErrorMessage(e, 'Send failed'))
  } finally {
    sending.value = false
  }
}

function openActions(message) {
  if (message?._pending) return
  actionSheetMessage.value = message
  actionSheetOpen.value = true
}
function closeActions() {
  actionSheetOpen.value = false
  actionSheetMessage.value = null
}

async function unsendSelected() {
  const m = actionSheetMessage.value
  const messageId = m?.id
  if (!messageId) return
  closeActions()
  try {
    await api.request('/message/direct/retract-direct-message', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: { receiverUsername: targetUsername.value, messageId },
    })
    await reload(true)
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Unsend failed'))
  }
}

async function heartSelected() {
  const m = actionSheetMessage.value
  const messageId = m?.id
  if (!messageId) return
  closeActions()
  try {
    const senderUsername = m?.sender?.userName || targetUsername.value
    await api.request('/message/direct/react-direct-message', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: { senderUsername, messageId, emoji: '❤️' },
    })
    await reload(true)
  } catch (e) {
    toast.error(apiErrorMessage(e, 'React failed'))
  }
}

const headerTitle = computed(() => targetName.value.trim() || targetUsername.value)

let poll
function startPoll() {
  poll = setInterval(() => {
    if (document.visibilityState === 'visible') reload(true)
  }, 4000)
}

const onFocus = () => reload(true)

onMounted(() => {
  bootstrap()
  startPoll()
  window.addEventListener('focus', onFocus)
})
onBeforeUnmount(() => {
  if (poll) clearInterval(poll)
  window.removeEventListener('focus', onFocus)
  for (const a of attachments.value) if (a?.url) URL.revokeObjectURL(a.url)
})
</script>

<template>
  <div class="flex h-[100dvh] flex-col bg-pixl-bg">
    <header class="flex items-center gap-3 border-b border-white/6 px-3 py-3 glass-nav">
      <button type="button" class="grid h-10 w-10 place-items-center rounded-full hover:bg-white/6" aria-label="Back" @click="navigateTo('/messages')">
        <UiIcon name="back" :size="20" />
      </button>
      <UiAvatar :src="targetProfilePic" :alt="headerTitle" :size="40" :to="`/profile/${targetUsername}`" />
      <NuxtLink :to="`/profile/${targetUsername}`" class="min-w-0 flex-1 truncate text-sm font-semibold">{{ headerTitle }}</NuxtLink>
    </header>

    <p v-if="error" class="px-4 py-2 text-sm text-pixl-danger">{{ error }}</p>

    <div ref="listRef" class="min-h-0 flex-1 overflow-y-auto px-3 py-3">
      <div v-if="loading" class="space-y-2 py-8"><UiSkeleton v-for="n in 6" :key="n" height="44px" /></div>
      <UiEmptyState v-else-if="messages.length === 0" title="Say hello." />
      <div
        v-for="m in messages"
        v-else
        :key="m?.id"
        class="my-1.5 flex"
        :class="isMine(m) ? 'justify-end' : 'justify-start'"
      >
        <button
          type="button"
          class="max-w-[78%] rounded-[18px] px-3.5 py-2 text-left"
          :class="isMine(m) ? 'bg-pixl-accent text-white' : 'bg-pixl-bubble text-pixl-text'"
          @click="openActions(m)"
        >
          <img
            v-if="Array.isArray(m?.mediaUrl) && m.mediaUrl.length"
            :src="normalizeUrl(String(m.mediaUrl[0] || ''))"
            alt=""
            class="mb-2 max-h-40 w-full rounded-xl object-cover"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <div class="whitespace-pre-wrap break-words text-sm" :class="m?.retracted ? 'italic opacity-80' : ''">
            {{ m?.retracted ? 'Message unsent' : (m?.message || '') }}
          </div>
          <div v-if="Array.isArray(m?.reactions) && m.reactions.length" class="mt-1 text-xs">
            {{ m.reactions.map((r) => r.emoji || r.type || '❤️').join(' ') }}
          </div>
          <div v-if="m?.createdAt" class="mt-1 text-[11px] opacity-70">{{ formatTime(m.createdAt) }}</div>
        </button>
      </div>
    </div>

    <div v-if="attachments.length" class="flex gap-2 overflow-x-auto px-4 py-2">
      <div v-for="(a, i) in attachments" :key="a.url" class="relative h-16 w-16 overflow-hidden rounded-xl">
        <img :src="a.url" alt="" class="h-full w-full object-cover" />
        <button type="button" class="absolute right-0 top-0 rounded-bl-xl bg-black/70 p-1" aria-label="Remove" @click="removeAttachment(i)">
          <UiIcon name="close" :size="12" />
        </button>
      </div>
    </div>

    <form class="flex items-center gap-2 border-t border-white/6 px-3 py-3" @submit.prevent="send">
      <input ref="fileInputRef" type="file" accept="image/*" multiple class="hidden" @change="onFilesSelected" />
      <button type="button" class="grid h-10 w-10 place-items-center rounded-full bg-white/8" aria-label="Add photo" :disabled="sending" @click="pickAttachments">
        <UiIcon name="image" :size="20" />
      </button>
      <input
        v-model="text"
        type="text"
        class="h-10 flex-1 rounded-full border border-white/8 bg-pixl-elevated px-4 text-sm"
        placeholder="Message…"
        :disabled="sending"
      />
      <UiButton type="submit" size="sm" :loading="sending" aria-label="Send">Send</UiButton>
    </form>

    <UiModal :open="actionSheetOpen" title="Message" @close="closeActions">
      <div class="space-y-2">
        <UiButton v-if="isMine(actionSheetMessage)" variant="danger" block @click="unsendSelected">Unsend</UiButton>
        <UiButton v-else block @click="heartSelected">❤️ React</UiButton>
        <UiButton variant="secondary" block @click="closeActions">Cancel</UiButton>
      </div>
    </UiModal>
  </div>
</template>
