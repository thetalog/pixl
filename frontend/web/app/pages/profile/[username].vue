<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = usePixlApi()
const { myUsername } = useAuth()
const username = computed(() => route.params.username?.toString?.() || '')
const isOwn = computed(() => !!myUsername.value && myUsername.value.toLowerCase() === username.value.toLowerCase())

const tab = ref('posts')
const savedIds = useState('saved-post-ids', () => new Set())

const { data: response, pending, error, refresh } = await useAsyncData(
  () => `profile-by-username:${username.value}`,
  () => api.request('/users/search/get-profile-by-username', { query: { username: username.value } }),
  { server: false, watch: [username] }
)

const profile = computed(() => response.value?.data || null)
const posts = computed(() => (Array.isArray(profile.value?.posts) ? profile.value.posts : []))
const reels = computed(() => (Array.isArray(profile.value?.reels) ? profile.value.reels : []))
const isPrivateLocked = computed(() => {
  if (isOwn.value) return false
  if (!profile.value) return false
  const vis = String(profile.value.profileVisibility || '').toUpperCase()
  return vis === 'PRIVATE' && !profile.value.isFollowed
})

const savedPosts = computed(() => {
  return posts.value.filter((p) => {
    if (savedIds.value.has(p.id)) return true
    return Array.isArray(p.savedBy) && p.savedBy.length > 0
  })
})

const gridItems = computed(() => {
  if (tab.value === 'reels') return reels.value
  if (tab.value === 'saved') return savedPosts.value
  return posts.value
})

function openPost(post) {
  const id = post?.id
  if (!id) return
  if (tab.value === 'reels') navigateTo('/reels')
  else navigateTo(`/posts/${id}`)
}
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
        <UiAvatar :src="profile.profilePic" :alt="profile.userName" :size="88" />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-xl font-semibold tracking-tight">{{ profile.userName || username }}</h1>
            <span v-if="profile.profileVisibility === 'PRIVATE'" class="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-pixl-muted">Private</span>
          </div>
          <p v-if="profile.name" class="mt-1 text-sm text-pixl-muted">{{ profile.name }}</p>
          <div class="mt-4 flex gap-6 text-sm">
            <div><span class="font-semibold">{{ profile.postsCount ?? posts.length }}</span> <span class="text-pixl-muted">posts</span></div>
            <div><span class="font-semibold">{{ profile.followersCount ?? 0 }}</span> <span class="text-pixl-muted">followers</span></div>
            <div><span class="font-semibold">{{ profile.followingCount ?? 0 }}</span> <span class="text-pixl-muted">following</span></div>
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
          <UiEmptyState v-if="gridItems.length === 0" :title="tab === 'saved' ? 'No saved posts yet.' : 'No posts yet.'" />
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
  </div>
</template>
