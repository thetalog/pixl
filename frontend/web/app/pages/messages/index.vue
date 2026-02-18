<script setup>
definePageMeta({ middleware: ['auth'] })

const api = usePixlApi()

const direct = ref([])
const groups = ref([])
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [directRes, groupRes] = await Promise.all([
      api.request('/message/direct/conversations', {
        method: 'GET',
        query: { skip: '0', take: '50' },
      }),
      api.request('/message/group/conversations', {
        method: 'GET',
        query: { skip: '0', take: '50' },
      }),
    ])

    direct.value = directRes?.conversations || []
    groups.value = groupRes?.conversations || []
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Failed to load conversations'
  } finally {
    loading.value = false
  }
}

await load()
</script>

<template>
  <div style="padding: 16px">
    <div style="display: flex; gap: 12px; align-items: center">
      <NuxtLink to="/home">Home</NuxtLink>
      <h1 style="margin: 0">Messages</h1>
    </div>

    <p v-if="loading">Loading…</p>
    <p v-else-if="error" style="color: red">{{ error }}</p>

    <template v-else>
      <h2>Direct</h2>
      <ul>
        <li v-for="c in direct" :key="c?.targetUsername || c?.userName || JSON.stringify(c)">
          <NuxtLink :to="`/messages/direct/${encodeURIComponent(c?.targetUsername || c?.userName || '')}`">
            {{ c?.targetUsername || c?.userName || 'Unknown' }}
          </NuxtLink>
        </li>
        <li v-if="direct.length === 0">No direct conversations</li>
      </ul>

      <h2>Groups</h2>
      <ul>
        <li v-for="g in groups" :key="g?.groupId || g?.id || JSON.stringify(g)">
          <NuxtLink :to="`/messages/group/${encodeURIComponent(g?.groupId || g?.id || '')}`">
            {{ g?.name || g?.groupName || (g?.groupId || g?.id) || 'Group' }}
          </NuxtLink>
        </li>
        <li v-if="groups.length === 0">No group conversations</li>
      </ul>
    </template>
  </div>
</template>
