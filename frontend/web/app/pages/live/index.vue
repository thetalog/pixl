<script setup>
definePageMeta({ middleware: 'auth' })

const apiLive = useLivestream()
const toast = useToast()
const { user } = useAuth()
const title = ref('')
const visibility = ref('PUBLIC')
const recordingEnabled = ref(false)
const starting = ref(false)
const endingOwn = ref(false)
const lives = ref([])
const loadingLives = ref(true)

const myLive = computed(() => lives.value.find((item) => apiLive.isOwnStream(item, user.value)) || null)

async function loadLives() {
  loadingLives.value = true
  try {
    lives.value = await apiLive.list()
  } catch {
    lives.value = []
  } finally {
    loadingLives.value = false
  }
}

async function startLive() {
  if (!title.value.trim()) {
    toast.error('Add a title')
    return
  }
  starting.value = true
  try {
    const stream = await apiLive.create({
      title: title.value.trim(),
      visibility: visibility.value,
      recordingEnabled: recordingEnabled.value,
    })
    const id = stream?.id
    if (!id) {
      toast.error('Live did not start')
      return
    }
    await navigateTo(apiLive.livePath(stream, user.value))
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not go live'))
  } finally {
    starting.value = false
  }
}

async function endOwnLive() {
  if (!myLive.value?.id) return
  endingOwn.value = true
  try {
    await apiLive.end(myLive.value.id)
    await loadLives()
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not end live'))
  } finally {
    endingOwn.value = false
  }
}

onMounted(loadLives)
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-10">
    <h1 class="text-2xl font-semibold tracking-tight">Go live</h1>
    <p class="mt-2 text-sm text-pixl-muted">
      Start a livestream. Viewers join through Pixl — media stays on your self-hosted servers.
    </p>

    <div v-if="myLive" class="mt-6 space-y-3 rounded-card bg-pixl-card p-5 ring-1 ring-white/6">
      <p class="text-sm font-semibold">You are live</p>
      <p class="text-sm text-pixl-muted">{{ myLive.title }} · {{ myLive.viewerCount || 0 }} watching</p>
      <div class="flex flex-wrap gap-2">
        <UiButton @click="navigateTo(apiLive.livePath(myLive, user))">Resume live</UiButton>
        <UiButton variant="danger" :loading="endingOwn" @click="endOwnLive">End</UiButton>
      </div>
    </div>

    <form v-else class="mt-6 space-y-4 rounded-card bg-pixl-card p-5 ring-1 ring-white/6" @submit.prevent="startLive">
      <UiTextField v-model="title" label="Title" placeholder="Late night hang" />
      <label class="block text-sm">
        <span class="mb-1.5 block text-pixl-muted">Who can join</span>
        <select v-model="visibility" class="h-10 w-full rounded-control border border-white/8 bg-pixl-elevated px-3 text-sm">
          <option value="PUBLIC">Anyone</option>
          <option value="FOLLOWERS">Followers</option>
          <option value="PRIVATE">Unlisted</option>
        </select>
      </label>
      <label class="flex items-center gap-2 text-sm text-pixl-muted">
        <input v-model="recordingEnabled" type="checkbox" class="accent-pixl-accent" />
        Save a recording (optional)
      </label>
      <UiButton type="submit" block :loading="starting">Go live</UiButton>
    </form>

    <section class="mt-10">
      <h2 class="text-sm font-semibold">Live now</h2>
      <p v-if="loadingLives" class="mt-3 text-sm text-pixl-muted">Loading…</p>
      <UiEmptyState v-else-if="!lives.length" title="Nobody is live right now." />
      <ul v-else class="mt-3 space-y-2">
        <li v-for="item in lives" :key="item.id">
          <NuxtLink
            :to="apiLive.livePath(item, user)"
            class="flex items-center gap-3 rounded-card bg-pixl-card px-3 py-3 ring-1 ring-white/6 hover:bg-white/4"
          >
            <UiAvatar :src="item.user?.profilePic" :alt="item.user?.userName" :size="40" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{{ item.title }}</p>
              <p class="truncate text-xs text-pixl-muted">@{{ item.user?.userName }} · {{ item.viewerCount || 0 }} watching</p>
            </div>
            <span class="text-[11px] font-semibold uppercase tracking-wider text-pixl-cyan">
              {{ apiLive.isOwnStream(item, user) ? 'Yours' : 'Live' }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
