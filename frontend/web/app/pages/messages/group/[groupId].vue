<script setup lang="js">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = usePixlApi()

const groupId = computed(() => String(route.params.groupId || ''))
const groupName = computed(() => String(route.query?.name || 'Group'))
const groupDisplayPicture = computed(() => String(route.query?.pic || ''))

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
    await api.request('/message/group/seen-message', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: { groupId: groupId.value },
    })
  } catch (_) {
    // best-effort
  }
}

async function reload() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.request('/message/group/messages', {
      method: 'GET',
      query: {
        groupId: groupId.value,
        skip: '0',
        take: '200',
      },
    })
    messages.value = Array.isArray(res?.messages) ? res.messages : []
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Failed to load group messages'
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
        groupId: groupId.value,
        message: msg ? msg : ' ',
      })
    )

    for (const a of attachments.value) {
      if (a?.file) form.append('files', a.file)
    }

    await api.request('/message/send-message', {
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

onMounted(() => {
  bootstrap()
})

onBeforeUnmount(() => {
  for (const a of attachments.value) {
    if (a?.url) URL.revokeObjectURL(a.url)
  }
})
</script>

<template>
  <div class="min-h-screen bg-white pb-24">
    <!-- Header (Flutter-like AppBar with avatar + group name) -->
    <div class="flex items-center gap-3 bg-black px-4 py-3 text-white">
      <button type="button" class="inline-flex items-center" aria-label="Back" @click="navigateTo('/messages')">
        <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
          <path fill="none" stroke="currentColor" stroke-width="2" d="M15 18 9 12l6-6" />
        </svg>
      </button>

      <div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-700">
        <img
          v-if="groupDisplayPicture"
          :src="normalizeUrl(groupDisplayPicture)"
          alt=""
          class="h-full w-full object-cover"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-white">
          <svg viewBox="0 0 24 24" class="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V21h14v-4.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V21h6v-4.5c0-2.33-4.67-3.5-7-3.5Z"
            />
          </svg>
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <div class="truncate text-base font-semibold">{{ groupName || 'Group' }}</div>
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
              role="group"
            >
              <div
                v-if="(m?.sender?.userName || '') !== myUsername && m?.sender?.userName"
                class="mb-1 text-[11px] font-semibold opacity-80"
              >
                {{ m.sender.userName }}
              </div>

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
  </div>
</template>
