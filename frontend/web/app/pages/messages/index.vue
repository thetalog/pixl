<script setup>
definePageMeta({ middleware: 'auth' })

const api = usePixlApi()
const toast = useToast()

const activeTab = ref('chats')
const query = ref('')
const loadingDirect = ref(true)
const loadingGroups = ref(true)
const directConversations = ref([])
const groupConversations = ref([])
const error = ref('')

const showNewChat = ref(false)
const showNewGroup = ref(false)
const newChatUsername = ref('')
const groupName = ref('')
const groupMembers = ref([])
const groupFile = ref(null)
const groupPreview = ref('')
const creatingGroup = ref(false)

const filteredDirect = computed(() => {
  if (!query.value.trim()) return directConversations.value
  const q = query.value.toLowerCase()
  return directConversations.value.filter((row) => {
    const name = (row?.user?.name || row?.user?.userName || '').toLowerCase()
    return name.includes(q)
  })
})

const filteredGroups = computed(() => {
  if (!query.value.trim()) return groupConversations.value
  const q = query.value.toLowerCase()
  return groupConversations.value.filter((row) => (row?.group?.name || '').toLowerCase().includes(q))
})

async function loadConversations() {
  try {
    const [direct, groups] = await Promise.all([
      api.request('/message/direct/conversations', { query: { skip: '0', take: '50' } }),
      api.request('/message/group/conversations', { query: { skip: '0', take: '50' } }),
    ])
    directConversations.value = Array.isArray(direct?.conversations) ? direct.conversations : []
    groupConversations.value = Array.isArray(groups?.conversations) ? groups.conversations : []
    error.value = ''
  } catch (e) {
    error.value = apiErrorMessage(e, 'Failed to load conversations.')
  } finally {
    loadingDirect.value = false
    loadingGroups.value = false
  }
}

onMounted(loadConversations)

function startChat() {
  const u = newChatUsername.value.trim()
  if (!u) return
  showNewChat.value = false
  navigateTo(`/messages/direct/${encodeURIComponent(u)}`)
}

function addMember(user) {
  const name = user?.userName
  if (!name || groupMembers.value.includes(name)) return
  groupMembers.value = [...groupMembers.value, name]
}

function onGroupFile(e) {
  const f = e.target.files?.[0]
  if (!f) return
  if (groupPreview.value) URL.revokeObjectURL(groupPreview.value)
  groupFile.value = f
  groupPreview.value = URL.createObjectURL(f)
}

async function createGroup() {
  if (!groupName.value.trim() || !groupFile.value || !groupMembers.value.length) {
    toast.error('Name, photo, and members are required')
    return
  }
  creatingGroup.value = true
  try {
    const [pic] = await prepareUploadFiles([groupFile.value])
    const form = new FormData()
    form.append('file', pic || groupFile.value)
    form.append(
      'postData',
      JSON.stringify({
        groupName: groupName.value.trim(),
        addedUsernames: groupMembers.value,
      })
    )
    const res = await api.request('/message/group/create-group', { method: 'POST', body: form })
    const id = res?.groupId
    showNewGroup.value = false
    if (id) navigateTo(`/messages/group/${encodeURIComponent(id)}?name=${encodeURIComponent(groupName.value)}`)
    else await loadConversations()
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not create group'))
  } finally {
    creatingGroup.value = false
  }
}

onBeforeUnmount(() => {
  if (groupPreview.value) URL.revokeObjectURL(groupPreview.value)
})
</script>

<template>
  <div class="mx-auto w-full max-w-xl px-4 py-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold tracking-tight">Messages</h1>
      <div class="flex gap-1">
        <button type="button" class="grid h-10 w-10 place-items-center rounded-full hover:bg-white/6" aria-label="New message" @click="showNewChat = true">
          <UiIcon name="plus" :size="20" />
        </button>
      </div>
    </div>

    <div class="mt-4 flex rounded-full bg-pixl-elevated p-1">
      <button type="button" class="flex-1 rounded-full py-2 text-sm font-medium" :class="activeTab === 'chats' ? 'bg-white/10 text-pixl-text' : 'text-pixl-muted'" @click="activeTab = 'chats'">Chats</button>
      <button type="button" class="flex-1 rounded-full py-2 text-sm font-medium" :class="activeTab === 'groups' ? 'bg-white/10 text-pixl-text' : 'text-pixl-muted'" @click="activeTab = 'groups'">Groups</button>
    </div>

    <input v-model="query" type="text" placeholder="Search" class="mt-4 h-10 w-full rounded-full border border-white/8 bg-pixl-elevated px-4 text-sm" />
    <p v-if="error" class="mt-3 text-sm text-pixl-danger">{{ error }}</p>

    <div v-if="activeTab === 'chats'" class="mt-2">
      <div v-if="loadingDirect" class="space-y-2 py-4"><UiSkeleton v-for="n in 5" :key="n" height="64px" rounded="rounded-card" /></div>
      <UiEmptyState v-else-if="filteredDirect.length === 0" title="No direct conversations." cta="New chat" @action="showNewChat = true" />
      <NuxtLink
        v-else
        v-for="row in filteredDirect"
        :key="row?.user?.id || row?.user?.userName"
        class="flex items-center gap-3 rounded-card px-2 py-3 hover:bg-white/4"
        :to="{
          path: `/messages/direct/${encodeURIComponent(row?.user?.userName || '')}`,
          query: { name: row?.user?.name || '', pic: normalizeUrl(row?.user?.profilePic || '') },
        }"
      >
        <UiAvatar :src="row?.user?.profilePic" :alt="row?.user?.userName" :size="40" />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold">{{ (row?.user?.name || '').trim() || row?.user?.userName }}</div>
          <div class="truncate text-sm text-pixl-muted">
            <template v-if="row?.latestMessage?.retracted">Message unsent</template>
            <template v-else>
              {{ (row?.latestMessage?.message || '').trim() || (row?.latestMessage?.mediaUrl?.length ? 'Attachment' : '') }}
            </template>
          </div>
        </div>
        <div class="text-xs text-pixl-tertiary">{{ formatListTime(row?.latestMessage?.createdAt) }}</div>
      </NuxtLink>
    </div>

    <div v-else class="mt-2">
      <div class="flex justify-end py-2">
        <UiButton size="sm" variant="secondary" @click="showNewGroup = true">New group</UiButton>
      </div>
      <div v-if="loadingGroups" class="space-y-2 py-4"><UiSkeleton v-for="n in 5" :key="n" height="64px" rounded="rounded-card" /></div>
      <UiEmptyState v-else-if="filteredGroups.length === 0" title="No group conversations." cta="Create group" @action="showNewGroup = true" />
      <NuxtLink
        v-else
        v-for="row in filteredGroups"
        :key="row?.group?.groupId"
        class="flex items-center gap-3 rounded-card px-2 py-3 hover:bg-white/4"
        :to="{
          path: `/messages/group/${encodeURIComponent(row?.group?.groupId || '')}`,
          query: { name: row?.group?.name || 'Group', pic: normalizeUrl(row?.group?.displayPicture || '') },
        }"
      >
        <UiAvatar :src="row?.group?.displayPicture" :alt="row?.group?.name" :size="40" />
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold">{{ row?.group?.name || 'Group' }}</div>
          <div class="truncate text-sm text-pixl-muted">
            <template v-if="!row?.latestMessage">No messages yet</template>
            <template v-else-if="row?.latestMessage?.retracted">Message unsent</template>
            <template v-else>{{ (row?.latestMessage?.message || '').trim() || (row?.latestMessage?.mediaUrl?.length ? 'Attachment' : '') }}</template>
          </div>
        </div>
        <div class="text-xs text-pixl-tertiary">{{ formatListTime(row?.latestMessage?.createdAt) }}</div>
      </NuxtLink>
    </div>

    <UiModal :open="showNewChat" title="New message" @close="showNewChat = false">
      <UiUserTypeahead placeholder="Search username" @select="(u) => { newChatUsername = u.userName; startChat() }" />
      <UiTextField v-model="newChatUsername" class="mt-3" label="Or type a username" @keydown.enter.prevent="startChat" />
      <UiButton class="mt-4" block @click="startChat">Start chat</UiButton>
    </UiModal>

    <UiModal :open="showNewGroup" title="Create group" @close="showNewGroup = false">
      <div class="space-y-4">
        <label class="block">
          <span class="mb-1.5 block text-sm text-pixl-muted">Group photo (required)</span>
          <input type="file" accept="image/*" @change="onGroupFile" />
          <img v-if="groupPreview" :src="groupPreview" alt="" class="mt-2 h-16 w-16 rounded-full object-cover" />
        </label>
        <UiTextField v-model="groupName" label="Group name" />
        <div>
          <p class="mb-1.5 text-sm text-pixl-muted">Members</p>
          <UiUserTypeahead @select="addMember" />
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="n in groupMembers" :key="n" class="rounded-full bg-white/8 px-3 py-1 text-xs">@{{ n }}</span>
          </div>
        </div>
        <UiButton block :loading="creatingGroup" @click="createGroup">Create</UiButton>
      </div>
    </UiModal>
  </div>
</template>
