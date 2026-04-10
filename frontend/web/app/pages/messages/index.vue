<script setup lang="js">
definePageMeta({ middleware: 'auth' })

const api = usePixlApi()

const activeTab = ref('chats')
const query = ref('')

const loadingDirect = ref(true)
const loadingGroups = ref(true)
const directConversations = ref([])
const groupConversations = ref([])
const error = ref('')

const showNewChat = ref(false)
const newChatUsername = ref('')

// ✅ NEW: dropdown state
const userResults = ref([])
const showDropdown = ref(false)
const loadingUsers = ref(false)

let timeout = null

watch(newChatUsername, (val) => {
  clearTimeout(timeout)

  if (!val.trim()) {
    userResults.value = []
    showDropdown.value = false
    return
  }

  timeout = setTimeout(async () => {
    loadingUsers.value = true
    try {
      const res = await api.request(
        '/users/search/get-profile-by-username',
        {
          method: 'GET',
          query: { username: val }
        }
      )

      userResults.value = res?.data ? [res.data] : []
      showDropdown.value = true
    } catch (e) {
      userResults.value = []
      showDropdown.value = false
    } finally {
      loadingUsers.value = false
    }
  }, 300)
})

function selectUser(user) {
  newChatUsername.value = user.userName
  showDropdown.value = false
}

function normalizeUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `http://${url}`
}

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

// ✅ close dropdown on outside click
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown')) {
      showDropdown.value = false
    }
  })
})

// Computed for filtered conversations
const filteredDirect = computed(() => {
  if (!query.value.trim()) return directConversations.value
  const q = query.value.toLowerCase()
  return directConversations.value.filter(row => {
    const name = (row?.user?.name || row?.user?.userName || '').toLowerCase()
    return name.includes(q)
  })
})

const filteredGroups = computed(() => {
  if (!query.value.trim()) return groupConversations.value
  const q = query.value.toLowerCase()
  return groupConversations.value.filter(row => {
    const name = (row?.group?.name || '').toLowerCase()
    return name.includes(q)
  })
})

// Fetch conversations on mount
onMounted(async () => {
  try {
    const [direct, groups] = await Promise.all([
      api.request('/message/direct/conversations'),
      api.request('/message/group/conversations')
    ])
    directConversations.value = direct?.data || []
    groupConversations.value = groups?.data || []
  } catch (err) {
    console.error('Failed to load conversations:', err)
    error.value = 'Failed to load conversations. Please try again.'
  } finally {
    loadingDirect.value = false
    loadingGroups.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-white pb-24 min-w-100">
    
    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <div class="mx-auto w-full max-w-md">
        <div class="flex">
          <button type="button" class="inline-flex items-center" aria-label="New message" @click="openNewChat">
        <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
          <path
            fill="currentColor"
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2.92 2.83H5v-.92l9.06-9.06.92.92L5.92 20.08ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"
          />
        </svg>
      </button>
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

    <!-- New Chat Modal -->
    <div v-if="showNewChat" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
        <button @click="showNewChat = false" class="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          <svg viewBox="0 0 24 24" class="h-6 w-6">
            <path fill="currentColor" d="M18.3 5.71a1 1 0 0 0-1.42 0L12 10.59l-4.88-4.88a1 1 0 0 0-1.42 1.42L10.59 12l-4.88 4.88a1 1 0 0 0 1.42 1.42L12 13.41l4.88 4.88a1 1 0 0 0 1.42-1.42L13.41 12l4.88-4.88a1 1 0 0 0 0-1.42Z"/>
          </svg>
        </button>
        <h3 class="text-lg font-semibold mb-4">New Message</h3>
        <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
        <!-- WRAPPER (important for dropdown positioning) -->
        <div class="relative user-dropdown">
          <!-- Input -->
          <input
            v-model="newChatUsername"
            type="text"
            class="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
            autocomplete="username"
            autofocus
            @keydown.enter.prevent="startChat"
            placeholder="Enter username"
          />
          <!-- Dropdown -->
          <div
            v-if="showDropdown"
            class="absolute left-0 w-full mt-1 bg-white border rounded-xl shadow z-50 max-h-60 overflow-y-auto"
          >
            <!-- Loading -->
            <div v-if="loadingUsers" class="px-3 py-2 text-sm text-gray-500">
              Searching...
            </div>
            <!-- Results -->
            <div
              v-for="user in userResults"
              :key="user.id"
              @click="selectUser(user)"
              class="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <div class="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                <img
                  v-if="user.profilePic"
                  :src="normalizeUrl(user.profilePic)"
                  class="h-full w-full object-cover"
                />
              </div>
              <div class="min-w-0">
                <div class="text-sm font-medium truncate">
                  {{ user.name || user.userName }}
                </div>
                <div class="text-xs text-gray-500 truncate">
                  @{{ user.userName }}
                </div>
              </div>
            </div>
            <!-- Empty -->
            <div
              v-if="!loadingUsers && userResults.length === 0"
              class="px-3 py-2 text-sm text-gray-500"
            >
              No users found
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button @click="showNewChat = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button @click="startChat" class="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800">
            Start Chat
          </button>
        </div>
      </div>
    </div>
   
  </div>
</template>
