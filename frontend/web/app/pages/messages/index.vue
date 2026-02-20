<script setup lang="js">
definePageMeta({ middleware: 'auth' })

const api = usePixlApi()

const profileUsernameCookie = useCookie('profile_username', { sameSite: 'lax', path: '/' })
const { user } = useAuth()

const myTitle = computed(() => {
  const u = profileUsernameCookie.value || user.value?.userName
  return typeof u === 'string' && u.trim() ? u.trim() : 'Messages'
})

const activeTab = ref('chats') // 'chats' | 'groups'
const query = ref('')

const loadingDirect = ref(true)
const loadingGroups = ref(true)
const directConversations = ref([])
const groupConversations = ref([])
const error = ref('')

const showNewChat = ref(false)
const newChatUsername = ref('')

function normalizeUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `http://${url}`
}

function formatListTime(iso) {
  if (!iso) return ''
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return ''
  const now = new Date()
  const sameDay =
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() &&
    dt.getDate() === now.getDate()

  if (sameDay) {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(dt)
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(dt)
}

function matchesQuery(text) {
  const q = query.value.trim().toLowerCase()
  if (!q) return true
  return String(text || '').toLowerCase().includes(q)
}

async function reloadDirect() {
  loadingDirect.value = true
  try {
    const res = await api.request('/message/direct/conversations', {
      method: 'GET',
      query: { skip: '0', take: '50' },
    })
    directConversations.value = Array.isArray(res?.conversations) ? res.conversations : []
  } finally {
    loadingDirect.value = false
  }
}

async function reloadGroups() {
  loadingGroups.value = true
  try {
    const res = await api.request('/message/group/conversations', {
      method: 'GET',
      query: { skip: '0', take: '50' },
    })
    groupConversations.value = Array.isArray(res?.conversations) ? res.conversations : []
  } finally {
    loadingGroups.value = false
  }
}

async function reloadAll() {
  error.value = ''
  try {
    await Promise.all([reloadDirect(), reloadGroups()])
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Failed to load conversations'
  }
}

const filteredDirect = computed(() => {
  const list = Array.isArray(directConversations.value) ? directConversations.value : []
  return list.filter((row) => {
    const userObj = row?.user || {}
    const username = userObj?.userName || ''
    const name = userObj?.name || ''
    const title = String(name || '').trim() ? String(name).trim() : String(username)
    return matchesQuery(`${title} ${username}`)
  })
})

const filteredGroups = computed(() => {
  const list = Array.isArray(groupConversations.value) ? groupConversations.value : []
  return list.filter((row) => {
    const group = row?.group || {}
    const groupName = group?.name || 'Group'
    return matchesQuery(groupName)
  })
})

function openNewChat() {
  newChatUsername.value = ''
  showNewChat.value = true
}

function startChat() {
  const u = newChatUsername.value.trim()
  if (!u) return
  showNewChat.value = false
  navigateTo(`/messages/direct/${encodeURIComponent(u)}`)
}

onMounted(() => {
  reloadAll()
})
</script>

<template>
  <div class="min-h-screen bg-white pb-24">
    <!-- Header (Flutter-like AppBar) -->
    <div class="flex items-center justify-between bg-black px-4 py-3 text-white">
      <div class="truncate text-base font-semibold">{{ myTitle }}</div>
      <button type="button" class="inline-flex items-center" aria-label="New message" @click="openNewChat">
        <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"
          />
        </svg>
      </button>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <div class="mx-auto w-full max-w-md">
        <div class="flex">
          <button
            type="button"
            class="flex-1 py-3 text-center text-sm"
            :class="activeTab === 'chats' ? 'border-b-2 border-black font-semibold text-black' : 'text-gray-500'"
            @click="activeTab = 'chats'"
          >
            Chats
          </button>
          <button
            type="button"
            class="flex-1 py-3 text-center text-sm"
            :class="activeTab === 'groups' ? 'border-b-2 border-black font-semibold text-black' : 'text-gray-500'"
            @click="activeTab = 'groups'"
          >
            Groups
          </button>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mx-auto w-full max-w-md px-4 pt-4">
      <div class="flex items-center gap-3 rounded-2xl bg-gray-100 px-4 py-3">
        <svg viewBox="0 0 24 24" class="h-5 w-5 text-gray-400" aria-hidden="true">
          <path
            fill="currentColor"
            d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
          />
        </svg>
        <input
          v-model="query"
          type="text"
          placeholder="Search"
          class="w-full bg-transparent text-sm text-gray-900 outline-none"
        />
      </div>

      <div v-if="error" class="pt-3 text-center text-sm text-gray-600">
        {{ error }}
      </div>
    </div>

    <!-- Lists -->
    <div class="mx-auto w-full max-w-md pt-2">
      <!-- Direct / Chats -->
      <div v-if="activeTab === 'chats'">
        <div v-if="loadingDirect" class="py-8 text-center text-sm text-gray-600">Loading…</div>
        <div v-else>
          <div v-if="filteredDirect.length === 0" class="py-8 text-center text-sm text-gray-600">
            No direct conversations
          </div>
          <div v-else class="divide-y divide-gray-100">
            <NuxtLink
              v-for="row in filteredDirect"
              :key="row?.user?.id || row?.user?.userName || JSON.stringify(row)"
              class="flex items-center gap-3 px-4 py-3"
              :to="{
                path: `/messages/direct/${encodeURIComponent(row?.user?.userName || '')}`,
                query: {
                  name: row?.user?.name || '',
                  pic: normalizeUrl(row?.user?.profilePic || ''),
                },
              }"
            >
              <div class="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-200">
                <img
                  v-if="row?.user?.profilePic"
                  :src="normalizeUrl(row?.user?.profilePic)"
                  alt=""
                  class="h-full w-full object-cover"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-gray-600">
                  <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                    />
                  </svg>
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold text-gray-900">
                  {{ (row?.user?.name || '').trim() || row?.user?.userName || '' }}
                </div>
                <div class="truncate text-sm text-gray-500">
                  <template v-if="row?.latestMessage?.retracted">Message unsent</template>
                  <template v-else>
                    {{
                      (row?.latestMessage?.message || '').trim()
                        ? String(row?.latestMessage?.message).trim()
                        : Array.isArray(row?.latestMessage?.mediaUrl) && row.latestMessage.mediaUrl.length
                          ? 'Attachment'
                          : ''
                    }}
                  </template>
                </div>
              </div>

              <div class="shrink-0 text-xs text-gray-500">
                {{ formatListTime(row?.latestMessage?.createdAt) }}
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Groups -->
      <div v-else>
        <div v-if="loadingGroups" class="py-8 text-center text-sm text-gray-600">Loading…</div>
        <div v-else>
          <div v-if="filteredGroups.length === 0" class="py-8 text-center text-sm text-gray-600">
            No group conversations
          </div>
          <div v-else class="divide-y divide-gray-100">
            <NuxtLink
              v-for="row in filteredGroups"
              :key="row?.group?.groupId || JSON.stringify(row)"
              class="flex items-center gap-3 px-4 py-3"
              :to="{
                path: `/messages/group/${encodeURIComponent(row?.group?.groupId || '')}`,
                query: {
                  name: row?.group?.name || 'Group',
                  pic: normalizeUrl(row?.group?.displayPicture || ''),
                },
              }"
            >
              <div class="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-200">
                <img
                  v-if="row?.group?.displayPicture"
                  :src="normalizeUrl(row?.group?.displayPicture)"
                  alt=""
                  class="h-full w-full object-cover"
                  loading="lazy"
                  referrerpolicy="no-referrer"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-gray-600">
                  <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V21h14v-4.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V21h6v-4.5c0-2.33-4.67-3.5-7-3.5Z"
                    />
                  </svg>
                </div>
              </div>

              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold text-gray-900">
                  {{ row?.group?.name || 'Group' }}
                </div>
                <div class="truncate text-sm text-gray-500">
                  <template v-if="!row?.latestMessage">No messages yet</template>
                  <template v-else-if="row?.latestMessage?.retracted">Message unsent</template>
                  <template v-else>
                    {{
                      (row?.latestMessage?.message || '').trim()
                        ? String(row?.latestMessage?.message).trim()
                        : Array.isArray(row?.latestMessage?.mediaUrl) && row.latestMessage.mediaUrl.length
                          ? 'Attachment'
                          : ''
                    }}
                  </template>
                </div>
              </div>

              <div class="shrink-0 text-xs text-gray-500">
                {{ formatListTime(row?.latestMessage?.createdAt) }}
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- New message dialog (Flutter AlertDialog equivalent) -->
    <div v-if="showNewChat" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="w-full max-w-sm rounded-2xl bg-white p-4">
        <div class="text-base font-semibold text-gray-900">New message</div>
        <div class="mt-3">
          <label class="block text-sm font-medium text-gray-700">Username</label>
          <input
            v-model="newChatUsername"
            type="text"
            class="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
            autocomplete="username"
            autofocus
            @keydown.enter.prevent="startChat"
          />
        </div>
        <div class="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            class="rounded-xl px-4 py-2 text-sm font-medium text-gray-700"
            @click="showNewChat = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            :disabled="!newChatUsername.trim()"
            @click="startChat"
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
