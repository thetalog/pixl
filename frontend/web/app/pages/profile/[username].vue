<script setup>
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = usePixlApi()

const username = computed(() => route.params.username?.toString?.() || '')

function firstString(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0]
  return null
}

function normalizeUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `http://${url}`
}

function extractPreviewUrl(post) {
  const mediaValue = post?.media
  if (!Array.isArray(mediaValue) || mediaValue.length === 0) return ''

  const media0 = mediaValue[0]
  if (!media0 || typeof media0 !== 'object') return ''

  const mimeType = media0.mimeType
  const candidate =
    mimeType === 'VIDEO' ? (media0.thumbnail ?? media0.url) : (media0.url ?? media0.thumbnail)

  const url = firstString(candidate)
  return normalizeUrl(url)
}

const { data: response, pending, error } = await useAsyncData(
  () => `profile-by-username:${username.value}`,
  () => api.request('/users/search/get-profile-by-username', { query: { username: username.value } }),
  { server: false, watch: [username] }
)

const user = computed(() => response.value?.data || null)
const posts = computed(() => (Array.isArray(user.value?.posts) ? user.value.posts : []))

function openPost(post) {
  const id = post?.id
  if (!id) return
  navigateTo(`/posts/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-white pb-24">
    <div class="flex items-center gap-3 bg-black px-4 py-3 text-white">
      <button type="button" class="inline-flex items-center" aria-label="Back" @click="navigateTo('/search')">
        <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
          <path fill="none" stroke="currentColor" stroke-width="2" d="M15 18 9 12l6-6" />
        </svg>
      </button>
      <div class="truncate text-base font-semibold">{{ username }}</div>
    </div>

    <div v-if="pending" class="px-4 py-6 text-sm text-gray-700">Loading…</div>
    <div v-else-if="error" class="px-4 py-6 text-sm text-gray-700">Failed to load profile.</div>
    <div v-else-if="!user" class="px-4 py-6 text-sm text-gray-700">User not found.</div>
    <div v-else class="px-4 pt-4">
      <div class="flex items-center gap-4">
        <div class="h-20 w-20 overflow-hidden rounded-full bg-gray-200">
          <img
            :src="user.profilePic || 'https://www.gravatar.com/avatar/000000000000000000000000000000?d=mp&f=y'"
            alt=""
            class="h-full w-full object-cover"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-lg font-semibold text-gray-900">{{ user.userName || username }}</div>
          <div class="truncate text-sm text-gray-500">{{ user.email || '' }}</div>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <div class="text-base font-semibold text-gray-900">{{ posts.length }}</div>
          <div class="text-xs text-gray-500">Posts</div>
        </div>
        <div>
          <div class="text-base font-semibold text-gray-900">{{ user.followersCount ?? 0 }}</div>
          <div class="text-xs text-gray-500">Followers</div>
        </div>
        <div>
          <div class="text-base font-semibold text-gray-900">{{ user.followingCount ?? 0 }}</div>
          <div class="text-xs text-gray-500">Following</div>
        </div>
      </div>
    </div>

    <div v-if="user" class="mt-4 border-t border-gray-100 px-2 pt-2">
      <div v-if="posts.length === 0" class="py-8 text-center text-sm text-gray-500">No posts</div>
      <div v-else class="columns-3 gap-1">
        <button
          v-for="p in posts"
          :key="p.id"
          type="button"
          class="mb-1 block w-full break-inside-avoid"
          aria-label="Open post"
          @click="openPost(p)"
        >
          <img
            :src="extractPreviewUrl(p)"
            alt=""
            class="w-full rounded-2xl bg-gray-100 object-cover"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </button>
      </div>
    </div>
  </div>
</template>
