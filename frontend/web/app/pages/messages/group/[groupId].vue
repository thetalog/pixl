<script setup>
definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const api = usePixlApi()

const groupId = computed(() => String(route.params.groupId || ''))
const messages = ref([])
const loading = ref(true)
const error = ref('')

const newMessage = ref('')
const sending = ref(false)

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api.request('/message/group/messages', {
      method: 'GET',
      query: {
        groupId: groupId.value,
        skip: '0',
        take: '200',
      },
    })
    messages.value = res?.messages || []
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Failed to load group messages'
  } finally {
    loading.value = false
  }
}

const send = async () => {
  const text = newMessage.value.trim()
  if (!text) return

  sending.value = true
  try {
    const form = new FormData()
    form.append('postData', JSON.stringify({ groupId: groupId.value, message: text }))

    await api.request('/message/send-message', {
      method: 'POST',
      body: form,
    })

    newMessage.value = ''
    await load()
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Send failed'
  } finally {
    sending.value = false
  }
}

await load()
</script>

<template>
  <div style="padding: 16px">
    <div style="display: flex; gap: 12px; align-items: center">
      <NuxtLink to="/messages">Back</NuxtLink>
      <h1 style="margin: 0">Group: {{ groupId }}</h1>
    </div>

    <p v-if="loading">Loading…</p>
    <p v-else-if="error" style="color: red">{{ error }}</p>

    <ul v-else style="margin-top: 16px">
      <li v-for="m in messages" :key="m?.id || JSON.stringify(m)">
        <b>{{ m?.senderUsername || m?.sender || 'user' }}:</b>
        {{ m?.message || m?.text || '' }}
      </li>
      <li v-if="messages.length === 0">No messages</li>
    </ul>

    <form @submit.prevent="send" style="display: flex; gap: 8px; margin-top: 16px">
      <input v-model="newMessage" placeholder="Type a message" style="flex: 1" />
      <button type="submit" :disabled="sending">{{ sending ? 'Sending…' : 'Send' }}</button>
    </form>
  </div>
</template>
