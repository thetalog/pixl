<script setup>
definePageMeta({ middleware: 'auth' })

const api = usePixlApi()
const toast = useToast()
const title = ref('')
const starting = ref(false)

async function startLive() {
  if (!title.value.trim()) {
    toast.error('Add a title')
    return
  }
  starting.value = true
  try {
    const stream = await api.request('/live/start', {
      method: 'POST',
      body: { title: title.value.trim() },
    })
    const id = stream?.id
    if (!id) {
      toast.error('Live did not start')
      return
    }
    await navigateTo(`/live/${encodeURIComponent(id)}?host=1`)
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not go live'))
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-lg px-4 py-10">
    <h1 class="text-2xl font-semibold tracking-tight">Go live</h1>
    <p class="mt-2 text-sm text-pixl-muted">Start a room. Viewers can join with the live ID. WebRTC playback is optional.</p>
    <form class="mt-6 space-y-4" @submit.prevent="startLive">
      <UiTextField v-model="title" label="Title" placeholder="Late night hang" />
      <UiButton type="submit" block :loading="starting">Start live</UiButton>
    </form>
  </div>
</template>
