<script setup>
definePageMeta({
  middleware: 'auth',
  alias: ['/settings', '/settings/'],
})

const api = usePixlApi()
const { user, fetchMe, logout } = useAuth()
const follow = useFollow()
const toast = useToast()

const name = ref('')
const about = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const saving = ref(false)
const visibilityBusy = ref(false)

onMounted(async () => {
  const me = user.value?.email ? user.value : await fetchMe()
  name.value = me?.name || ''
  about.value = me?.bio || ''
})

const visibilityLabel = computed(() => {
  const v = String(user.value?.profileVisibility || 'PUBLIC').toUpperCase()
  return v === 'PRIVATE' ? 'Private' : v === 'BANNED' ? 'Banned' : 'Public'
})

async function saveProfile() {
  saving.value = true
  try {
    const query = {}
    if (name.value.trim()) query.name = name.value.trim()
    if (about.value.trim() || about.value === '') query.about = about.value
    if (oldPassword.value && newPassword.value) {
      query.oldPassword = oldPassword.value
      query.newPassword = newPassword.value
    }
    if (!query.name && query.about === undefined && !(query.oldPassword && query.newPassword)) {
      toast.error('Change at least one field')
      return
    }
    await api.request('/profile/update', { method: 'POST', query })
    await fetchMe()
    oldPassword.value = ''
    newPassword.value = ''
    toast.success('Profile updated')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Update failed'))
  } finally {
    saving.value = false
  }
}

async function toggleVis() {
  visibilityBusy.value = true
  try {
    await follow.toggleVisibility()
    await fetchMe()
    toast.success(`Now ${visibilityLabel.value.toLowerCase()}`)
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not change visibility'))
  } finally {
    visibilityBusy.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-lg px-4 py-8">
    <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
    <p class="mt-1 text-sm text-pixl-muted">@{{ user?.userName }}</p>

    <form class="mt-8 space-y-4" @submit.prevent="saveProfile">
      <UiTextField v-model="name" label="Name" />
      <UiTextField v-model="about" label="Bio" multiline />
      <UiTextField v-model="oldPassword" label="Current password" type="password" autocomplete="current-password" />
      <UiTextField v-model="newPassword" label="New password" type="password" autocomplete="new-password" />
      <UiButton type="submit" :loading="saving" block>Save changes</UiButton>
    </form>

    <div class="mt-8 rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold">Profile visibility</p>
          <p class="text-sm text-pixl-muted">Currently {{ visibilityLabel }}</p>
        </div>
        <UiButton variant="secondary" :loading="visibilityBusy" @click="toggleVis">Toggle</UiButton>
      </div>
    </div>

    <div class="mt-4 space-y-2">
      <NuxtLink to="/appeals" class="block rounded-card bg-pixl-card px-4 py-3 text-sm ring-1 ring-white/6 hover:bg-white/4">
        Appeal a moderation decision
      </NuxtLink>
      <NuxtLink
        v-if="user?.capabilities?.isStaff || (user?.roleKey && user.roleKey !== 'USER')"
        to="/admin"
        class="block rounded-card bg-pixl-card px-4 py-3 text-sm ring-1 ring-white/6 hover:bg-white/4"
      >
        Open admin console
      </NuxtLink>
    </div>

    <UiButton class="mt-8" variant="danger" block @click="logout">Log out</UiButton>
  </div>
</template>
