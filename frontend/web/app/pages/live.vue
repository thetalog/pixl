<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">Live Streams</h1>

    <!-- Create Stream Button -->
    <div class="mb-8">
      <button
        class="btn-primary"
        @click="showCreateModal = true"
      >
        Start Live Stream
      </button>
    </div>

    <!-- Active Streams -->
    <div v-if="liveStore.liveStreams.length > 0">
      <h2 class="text-2xl font-bold mb-6">Currently Live</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="stream in activeLiveStreams"
          :key="stream.id"
          class="card-base cursor-pointer hover:opacity-75 transition-opacity"
          @click="navigateTo(`/live/${stream.id}`)"
        >
          <div class="relative mb-4">
            <div class="bg-black rounded-lg aspect-video flex items-center justify-center">
              <span class="text-gray-400">Live Stream Preview</span>
            </div>
            <div class="absolute top-2 right-2 bg-red-500 px-3 py-1 rounded-full flex items-center gap-2">
              <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span class="text-sm font-semibold">LIVE</span>
            </div>
          </div>
          <h3 class="font-bold text-lg mb-2">{{ stream.title }}</h3>
          <p class="text-sm text-gray-400 mb-2">{{ stream.description }}</p>
          <p class="text-sm text-gray-400">
            <strong>{{ stream.viewers || 0 }}</strong> watching
          </p>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <p class="text-gray-400 mb-4">No active streams right now</p>
      <button
        class="btn-primary"
        @click="showCreateModal = true"
      >
        Be the first to go live!
      </button>
    </div>

    <!-- Create Stream Modal -->
    <Modal
      v-if="showCreateModal"
      title="Start a Live Stream"
      confirm-text="Start"
      :loading="liveStore.isLoading"
      @confirm="handleCreateStream"
      @cancel="showCreateModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold mb-2">Stream Title</label>
          <input
            v-model="streamData.title"
            type="text"
            class="input-base w-full"
            placeholder="What are you streaming about?"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-2">Description</label>
          <textarea
            v-model="streamData.description"
            class="input-base w-full"
            rows="3"
            placeholder="Add a description..."
          ></textarea>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLiveStore } from '~/stores/live'
import { LiveStream } from '~/types'

definePageMeta({
  layout: 'default'
})

const liveStore = useLiveStore()

const showCreateModal = ref(false)
const streamData = ref({
  title: '',
  description: ''
})

const activeLiveStreams = computed(() =>
  liveStore.liveStreams.filter(s => s.status === 'live')
)

onMounted(async () => {
  await liveStore.getLiveStreams()
})

const handleCreateStream = async () => {
  const result = await liveStore.createStream(streamData.value)
  if (result.success) {
    showCreateModal.value = false
    streamData.value = { title: '', description: '' }
    await navigateTo(`/live/${result.data!.id}`)
  }
}
</script>
