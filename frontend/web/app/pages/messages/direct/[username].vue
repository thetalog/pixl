<script setup lang="js">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = usePixlApi()

const targetUsername = computed(() => String(route.params.username || ''))
const targetName = computed(() => String(route.query?.name || ''))
const targetProfilePic = computed(() => String(route.query?.pic || ''))

const profileUsernameCookie = useCookie('profile_username', { sameSite: 'lax', path: '/' })
const { user } = useAuth()
const myUsername = computed(() => String(profileUsernameCookie.value || user.value?.userName || ''))

const loading = ref(true)
const sending = ref(false)
const error = ref('')
const messages = ref([])

const text = ref('')
const attachments = ref([]) // { file: File, url: string }

const listRef = ref(null)
const fileInputRef = ref(null)

const actionSheetOpen = ref(false)
const actionSheetMessage = ref(null)

function normalizeUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `http://${url}`
}

function formatTime(iso) {
  if (!iso) return ''
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(dt)
}

async function markSeenBestEffort() {
  try {
    await api.request('/message/direct/seen-direct-message', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: { senderUsername: targetUsername.value },
    })
  } catch (_) {
    // best-effort
  }
}

async function reload() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.request('/message/direct/messages', {
      method: 'GET',
      query: {
        targetUsername: targetUsername.value,
        skip: '0',
        take: '200',
      },
    })
    messages.value = Array.isArray(res?.messages) ? res.messages : []
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Failed to load messages'
    messages.value = []
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
  if (files.length === 0) return

  const next = []
  for (const f of files) {
    if (!(f instanceof File)) continue
    next.push({ file: f, url: URL.createObjectURL(f) })
  }

  attachments.value = next
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

  sending.value = true
  error.value = ''
  try {
    const form = new FormData()
    form.append(
      'postData',
      JSON.stringify({
        receiverUsername: targetUsername.value,
        message: msg ? msg : ' ',
      })
    )

    for (const a of attachments.value) {
      if (a?.file) form.append('files', a.file)
    }

    await api.request('/message/direct/send-message', {
      method: 'POST',
      body: form,
    })

    text.value = ''
    for (const a of attachments.value) {
      if (a?.url) URL.revokeObjectURL(a.url)
    }
    attachments.value = []

    await reload()
    await nextTick()
    scrollToBottom()
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Send failed'
  } finally {
    sending.value = false
  }
}

function openActions(message) {
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
    await reload()
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Unsend failed'
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
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'React failed'
  }
}

let longPressTimer = null
function onPressStart(message) {
  if (longPressTimer) clearTimeout(longPressTimer)
  longPressTimer = setTimeout(() => {
    openActions(message)
  }, 450)
}
function onPressEnd() {
  if (longPressTimer) clearTimeout(longPressTimer)
  longPressTimer = null
}

const headerTitle = computed(() => {
  const n = targetName.value?.trim?.() || ''
  return n ? n : targetUsername.value
})

onMounted(() => {
  bootstrap()
})

onBeforeUnmount(() => {
  for (const a of attachments.value) {
    if (a?.url) URL.revokeObjectURL(a.url)
  }
  if (longPressTimer) clearTimeout(longPressTimer)
})
</script>

<template>
  <div class="min-h-screen bg-white pb-24">
    <!-- Header (Flutter-like AppBar with avatar + name) -->
    <div class="flex items-center gap-3 bg-black px-4 py-3 text-white">
      <button type="button" class="inline-flex items-center" aria-label="Back" @click="navigateTo('/messages')">
        <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
          <path fill="none" stroke="currentColor" stroke-width="2" d="M15 18 9 12l6-6" />
        </svg>
      </button>

      <div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-700">
        <img
          v-if="targetProfilePic"
          :src="normalizeUrl(targetProfilePic)"
          alt=""
          class="h-full w-full object-cover"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-white">
          <svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
            />
          </svg>
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <div class="truncate text-base font-semibold">{{ headerTitle }}</div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-md">
      <div v-if="error" class="px-4 py-3 text-sm text-gray-700">{{ error }}</div>

      <!-- Messages list -->
      <div v-if="loading" class="flex items-center justify-center py-10 text-sm text-gray-600">Loading…</div>
      <div v-else class="px-3 pt-3">
        <div
          ref="listRef"
          class="h-[calc(100vh-64px-110px-96px)] overflow-y-auto px-1"
        >
          <div v-if="messages.length === 0" class="py-10 text-center text-sm text-gray-600">No messages</div>

          <div
            v-for="m in messages"
            :key="m?.id || JSON.stringify(m)"
            class="my-1 flex"
            :class="(m?.sender?.userName || '') === myUsername ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[78%] rounded-2xl px-3 py-2"
              :class="(m?.sender?.userName || '') === myUsername ? 'bg-black text-white' : 'bg-gray-200 text-gray-900'"
              :style="
                (m?.sender?.userName || '') === myUsername
                  ? 'border-bottom-right-radius: 6px;'
                  : 'border-bottom-left-radius: 6px;'
              "
              role="button"
              tabindex="0"
              @contextmenu.prevent="openActions(m)"
              @mousedown="onPressStart(m)"
              @mouseup="onPressEnd"
              @mouseleave="onPressEnd"
              @touchstart.passive="onPressStart(m)"
              @touchend="onPressEnd"
              @touchcancel="onPressEnd"
            >
              <template v-if="Array.isArray(m?.mediaUrl) && m.mediaUrl.length">
                <img
                  :src="normalizeUrl(String(m.mediaUrl[0] || ''))"
                  alt=""
                  class="mb-2 max-h-40 w-full rounded-xl object-cover"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
              </template>

              <div
                class="whitespace-pre-wrap break-words text-sm"
                :class="m?.retracted ? 'italic opacity-80' : ''"
              >
                {{ m?.retracted ? 'Message unsent' : (m?.message || '') }}
              </div>

              <div v-if="m?.createdAt" class="mt-1 text-[11px] opacity-70">
                {{ formatTime(m.createdAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Attachments preview row -->
      <div v-if="attachments.length" class="px-4 pt-2">
        <div class="flex gap-2 overflow-x-auto py-2">
          <div
            v-for="(a, i) in attachments"
            :key="a?.url || i"
            class="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-200"
          >
            <img :src="a.url" alt="" class="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove"
              class="absolute right-0 top-0 rounded-bl-xl bg-white/90 p-1 text-gray-900"
              @click="removeAttachment(i)"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
                <path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L12 13.41l-6.89 6.3-1.42-1.41L10.59 12 3.69 5.71 5.1 4.29 12 10.59l6.89-6.3 1.41 1.42Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Composer -->
      <div class="px-4 pb-4 pt-2">
        <div class="flex items-center gap-2">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="onFilesSelected"
          />

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-900 disabled:opacity-60"
            aria-label="Add photo"
            :disabled="sending"
            @click="pickAttachments"
          >
            <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
              <path
                fill="currentColor"
                d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V5h14v14ZM8.5 13.5 11 16.51 14.5 12 19 18H5l3.5-4.5Z"
              />
            </svg>
          </button>

          <input
            v-model="text"
            type="text"
            class="h-10 flex-1 rounded-full border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-gray-900"
            placeholder="Message…"
            :disabled="sending"
            @keydown.enter.prevent="send"
          />

          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white disabled:opacity-60"
            aria-label="Send"
            :disabled="sending"
            @click="send"
          >
            <svg v-if="!sending" viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true">
              <path fill="currentColor" d="M2 21 23 12 2 3v7l15 2-15 2v7Z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" class="h-5 w-5 animate-spin" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 4a8 8 0 0 1 7.75 6h-2.06A6 6 0 1 0 18 12h2a8 8 0 0 1-8 8 8 8 0 0 1 0-16Z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Action sheet (Flutter bottom sheet equivalent) -->
    <div v-if="actionSheetOpen" class="fixed inset-0 z-50 bg-black/40" @click="closeActions">
      <div
        class="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white p-2"
        @click.stop
      >
        <div class="mx-auto mb-2 h-1.5 w-10 rounded-full bg-gray-200" />

        <button
          v-if="(actionSheetMessage?.sender?.userName || '') === myUsername"
          type="button"
          class="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
          @click="unsendSelected"
        >
          Unsend
        </button>

        <button
          v-else
          type="button"
          class="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
          @click="heartSelected"
        >
          ❤️
        </button>

        <button
          type="button"
          class="mt-1 w-full rounded-xl px-4 py-3 text-left text-sm text-gray-600 hover:bg-gray-50"
          @click="closeActions"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
