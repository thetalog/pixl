<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = usePixlApi()
const toast = useToast()
const { myUsername, fetchMe, user } = useAuth()
const username = computed(() => route.params.username?.toString?.() || '')
const isOwn = computed(() => !!myUsername.value && myUsername.value.toLowerCase() === username.value.toLowerCase())

const tab = ref('posts')
const picOpen = ref(false)
const listKind = ref('')
const listUsers = ref([])
const listLoading = ref(false)
const picUploading = ref(false)
const picInput = ref(null)

const { data: response, pending, error, refresh } = await useAsyncData(
  () => `profile-by-username:${username.value}`,
  () => api.request('/users/search/get-profile-by-username', { query: { username: username.value } }),
  { server: false, watch: [username] }
)

const {
  data: savedResponse,
  pending: savedPending,
  refresh: refreshSaved,
} = await useAsyncData(
  () => `saved-posts:${myUsername.value || 'anon'}`,
  async () => {
    if (!isOwn.value) return { data: [] }
    return api.request('/posts/saved')
  },
  { server: false, watch: [isOwn] }
)

const profile = computed(() => response.value?.data || null)
const posts = computed(() => (Array.isArray(profile.value?.posts) ? profile.value.posts : []))
const reels = computed(() => (Array.isArray(profile.value?.reels) ? profile.value.reels : []))
const savedPosts = computed(() => (Array.isArray(savedResponse.value?.data) ? savedResponse.value.data : []))
const isPrivateLocked = computed(() => {
  if (isOwn.value) return false
  if (!profile.value) return false
  const vis = String(profile.value.profileVisibility || '').toUpperCase()
  return vis === 'PRIVATE' && !profile.value.isFollowed
})

const gridItems = computed(() => {
  if (tab.value === 'reels') return reels.value
  if (tab.value === 'saved') return savedPosts.value
  return posts.value
})

const listTitle = computed(() => {
  if (listKind.value === 'followers') return 'Followers'
  if (listKind.value === 'following') return 'Following'
  return 'Posts'
})

function openPost(post) {
  const id = post?.id
  if (!id) return
  if (tab.value === 'reels') navigateTo('/reels')
  else navigateTo(`/posts/${id}`)
}

function openAvatar() {
  picOpen.value = true
}

async function openList(kind) {
  if (isPrivateLocked.value && kind !== 'posts') return
  if (kind === 'posts') {
    tab.value = 'posts'
    listKind.value = ''
    return
  }
  listKind.value = kind
  listLoading.value = true
  listUsers.value = []
  try {
    const path = kind === 'followers' ? '/users/followers' : '/users/following'
    const res = await api.request(path, { query: { username: username.value } })
    listUsers.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not load list'))
    listKind.value = ''
  } finally {
    listLoading.value = false
  }
}

async function onPickPic(event) {
  const file = event?.target?.files?.[0]
  if (!file || picUploading.value) return
  picUploading.value = true
  try {
    const [pic] = await prepareUploadFiles([file])
    const form = new FormData()
    form.append('file', pic || file)
    const res = await api.request('/profile/picture', { method: 'POST', body: form })
    const nextPic = res?.data?.profilePic
    if (profile.value && nextPic) profile.value.profilePic = nextPic
    if (user.value) user.value = { ...user.value, profilePic: nextPic }
    await fetchMe()
    await refresh()
    toast.success('Profile photo updated')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not update photo'))
  } finally {
    picUploading.value = false
    if (picInput.value) picInput.value.value = ''
  }
}

watch(tab, (next) => {
  if (next === 'saved' && isOwn.value) refreshSaved()
})
</script>

<template>
  <div class="mx-auto w-full max-w-[720px] px-4 py-6">
    <div v-if="pending" class="space-y-4">
      <div class="flex gap-6">
        <UiSkeleton height="88px" width="88px" rounded="rounded-full" :block="false" />
        <div class="flex-1 space-y-2">
          <UiSkeleton height="24px" />
          <UiSkeleton height="16px" />
        </div>
      </div>
    </div>
    <UiEmptyState v-else-if="error" title="Couldn’t load this profile." cta="Retry" @action="refresh" />
    <UiEmptyState v-else-if="!profile" title="User not found." cta="Search" @action="navigateTo('/search')" />

    <div v-else>
      <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
        <button type="button" class="self-start" :aria-label="isOwn ? 'View profile photo' : 'Profile photo'" @click="openAvatar">
          <UiAvatar :src="profile.profilePic" :alt="profile.userName" :size="88" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-xl font-semibold tracking-tight">{{ profile.userName || username }}</h1>
            <span v-if="profile.profileVisibility === 'PRIVATE'" class="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-pixl-muted">Private</span>
          </div>
          <p v-if="profile.name" class="mt-1 text-sm text-pixl-muted">{{ profile.name }}</p>
          <div class="mt-4 flex gap-6 text-sm">
            <button type="button" class="text-left" @click="openList('posts')">
              <span class="font-semibold">{{ profile.postsCount ?? posts.length }}</span> <span class="text-pixl-muted">posts</span>
            </button>
            <button type="button" class="text-left" @click="openList('followers')">
              <span class="font-semibold">{{ profile.followersCount ?? 0 }}</span> <span class="text-pixl-muted">followers</span>
            </button>
            <button type="button" class="text-left" @click="openList('following')">
              <span class="font-semibold">{{ profile.followingCount ?? 0 }}</span> <span class="text-pixl-muted">following</span>
            </button>
          </div>
          <p v-if="profile.bio" class="mt-3 whitespace-pre-wrap text-sm">{{ profile.bio }}</p>
          <a
            v-if="profile.website"
            :href="normalizeUrl(profile.website)"
            class="mt-1 inline-block text-sm text-pixl-accent hover:text-pixl-accent-2"
            target="_blank"
            rel="noreferrer"
          >{{ profile.website }}</a>

          <div class="mt-4 flex flex-wrap gap-2">
            <template v-if="isOwn">
              <UiButton variant="secondary" size="sm" @click="navigateTo('/settings')">Edit profile</UiButton>
              <UiButton variant="secondary" size="sm" @click="tab = 'saved'">Saved</UiButton>
              <UiButton size="sm" @click="navigateTo('/create')">Create</UiButton>
            </template>
            <template v-else>
              <UiFollowButton :username="username" :initial-followed="!!profile.isFollowed" @change="refresh" />
              <UiButton variant="secondary" size="sm" @click="navigateTo(`/messages/direct/${encodeURIComponent(username)}`)">Message</UiButton>
            </template>
          </div>
        </div>
      </div>

      <div v-if="isPrivateLocked" class="mt-10 rounded-card bg-pixl-card p-10 text-center ring-1 ring-white/6">
        <p class="text-sm text-pixl-muted">This account is private. Follow to see their posts.</p>
      </div>

      <template v-else>
        <div class="mt-8 flex justify-center gap-8 border-b border-white/6">
          <button
            v-for="t in (isOwn ? ['posts', 'reels', 'saved'] : ['posts', 'reels'])"
            :key="t"
            type="button"
            class="pb-3 text-xs font-semibold uppercase tracking-wider"
            :class="tab === t ? 'border-b-2 border-pixl-text text-pixl-text' : 'text-pixl-tertiary'"
            @click="tab = t"
          >
            {{ t }}
          </button>
        </div>

        <div class="mt-2">
          <UiEmptyState v-if="tab === 'saved' && savedPending" title="Loading saved posts…" />
          <UiEmptyState v-else-if="gridItems.length === 0" :title="tab === 'saved' ? 'No saved posts yet.' : 'No posts yet.'" />
          <div v-else class="grid grid-cols-3 gap-1">
            <button
              v-for="p in gridItems"
              :key="p.id"
              type="button"
              class="relative aspect-square overflow-hidden bg-pixl-elevated"
              aria-label="Open post"
              @click="openPost(p)"
            >
              <img
                v-if="extractPreviewUrl(p)"
                :src="extractPreviewUrl(p)"
                alt=""
                class="h-full w-full object-cover"
                loading="lazy"
                referrerpolicy="no-referrer"
                @error="($event) => { $event.target.style.display = 'none' }"
              />
              <span v-else class="grid h-full w-full place-items-center text-pixl-muted">
                <UiIcon name="image" :size="22" />
              </span>
            </button>
          </div>
        </div>
      </template>
    </div>

    <UiModal :open="picOpen" :title="isOwn ? 'Profile photo' : (profile?.userName || 'Photo')" @close="picOpen = false">
      <div class="space-y-4">
        <img
          v-if="normalizeUrl(profile?.profilePic)"
          :src="normalizeUrl(profile.profilePic)"
          :alt="profile?.userName || ''"
          class="mx-auto max-h-80 w-full rounded-card object-cover"
        />
        <div v-else class="grid h-48 place-items-center rounded-card bg-pixl-card text-pixl-muted">
          <UiIcon name="user" :size="48" />
        </div>
        <template v-if="isOwn">
          <input ref="picInput" type="file" accept="image/*" class="hidden" @change="onPickPic" />
          <UiButton block :loading="picUploading" @click="picInput?.click()">Change profile photo</UiButton>
        </template>
      </div>
    </UiModal>

    <UiModal :open="!!listKind && listKind !== 'posts'" :title="listTitle" @close="listKind = ''">
      <div v-if="listLoading" class="space-y-3">
        <UiSkeleton v-for="n in 4" :key="n" height="56px" rounded="rounded-card" />
      </div>
      <UiEmptyState v-else-if="listUsers.length === 0" :title="`No ${listTitle.toLowerCase()} yet.`" />
      <ul v-else class="max-h-80 space-y-2 overflow-y-auto">
        <li v-for="u in listUsers" :key="u.id || u.userName">
          <NuxtLink
            :to="u.userName ? `/profile/${encodeURIComponent(u.userName)}` : ''"
            class="flex items-center gap-3 rounded-card px-1 py-2 hover:bg-white/6"
            @click="listKind = ''"
          >
            <UiAvatar :src="u.profilePic" :alt="u.userName" :size="40" />
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold">{{ u.userName }}</p>
              <p v-if="u.name" class="truncate text-xs text-pixl-muted">{{ u.name }}</p>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </UiModal>
  </div>
</template>
