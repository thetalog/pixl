<script setup>
definePageMeta({ middleware: 'auth' })

const api = usePixlApi()

const query = ref('')
const results = ref([])
const loading = ref(false)

let timer = null

async function performSearch() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    return
  }

  loading.value = true
  try {
    const res = await api.request('/users/search/all', {
      query: { username: q },
    })
    results.value = Array.isArray(res) ? res : []
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

watch(
  query,
  () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      performSearch()
    }, 400)
  },
  { immediate: false }
)

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

function openProfile(user) {
  const username = user?.userName
  if (!username) return
  navigateTo(`/profile/${username}`)
}
</script>

<template>
  <div class="min-h-screen bg-white pb-24">
    <div class="flex items-center gap-3 bg-white px-4 py-3">
      <button type="button" class="inline-flex items-center text-black" aria-label="Back" @click="navigateTo('/explore')">
        <svg viewBox="0 0 24 24" class="h-6 w-6" aria-hidden="true">
          <path fill="none" stroke="currentColor" stroke-width="2" d="M15 18 9 12l6-6" />
        </svg>
      </button>
      <input
        v-model="query"
        type="text"
        autofocus
        placeholder="Search username..."
        class="w-full border-0 bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" aria-label="Loading" />
    </div>

    <div v-else-if="results.length === 0" class="py-10 text-center text-sm text-gray-500">
      {{ query.trim() ? 'No users found' : 'Search for users' }}
    </div>

    <div v-else class="divide-y divide-gray-100">
      <button
        v-for="u in results"
        :key="u.id || u.userName"
        type="button"
        class="flex w-full items-center gap-3 px-4 py-3 text-left"
        @click="openProfile(u)"
      >
        <div class="h-10 w-10 overflow-hidden rounded-full bg-gray-200">
          <img
            :src="u.profilePic || 'https://www.gravatar.com/avatar/000000000000000000000000000000?d=mp&f=y'"
            alt=""
            class="h-full w-full object-cover"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold text-gray-900">{{ u.userName || '' }}</div>
          <div class="truncate text-xs text-gray-500">{{ u.email || '' }}</div>
        </div>
      </button>
    </div>
  </div>
</template>
