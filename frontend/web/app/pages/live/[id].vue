<template>
  <div class="max-w-7xl mx-auto p-6">
    <!-- Back Button -->
    <NuxtLink to="/live" class="flex items-center gap-2 text-accent hover:underline mb-6">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
      Back to Live
    </NuxtLink>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center">
      <LoadingSpinner visible message="Loading stream..." />
    </div>

    <!-- Stream Content -->
    <div v-else-if="stream" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Video Player -->
      <div class="lg:col-span-2">
        <div class="bg-black rounded-lg aspect-video flex items-center justify-center mb-6 relative">
          <span class="text-gray-400">Live Stream Video Player</span>
          <div class="absolute top-2 right-2 bg-red-500 px-3 py-1 rounded-full flex items-center gap-2">
            <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span class="text-sm font-semibold text-white">LIVE</span>
          </div>
        </div>

        <!-- Stream Info -->
        <div class="card-base">
          <h1 class="text-3xl font-bold mb-2">{{ stream.title }}</h1>
          <p class="text-gray-400 mb-4">{{ stream.description }}</p>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <img
                v-if="stream.user?.avatar"
                :src="stream.user.avatar"
                :alt="stream.user.username"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div v-else class="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <span class="text-white font-bold">{{ stream.user?.username?.charAt(0).toUpperCase() }}</span>
              </div>
              <div>
                <p class="font-semibold">{{ stream.user?.username }}</p>
                <p class="text-sm text-gray-400">{{ stream.viewers || 0 }} watching</p>
              </div>
            </div>
            <button class="btn-primary">Follow</button>
          </div>
        </div>
      </div>

      <!-- Live Chat -->
      <div class="card-base lg:col-span-1 flex flex-col h-96">
        <h2 class="text-xl font-bold mb-4">Live Chat</h2>
        
        <!-- Chat Messages -->
        <div class="flex-1 overflow-y-auto mb-4 space-y-2 bg-primary rounded p-3">
          <div
            v-for="chat in chats"
            :key="chat.id"
            class="text-sm"
          >
            <p class="text-accent font-semibold">{{ chat.user?.username }}</p>
            <p class="text-gray-300">{{ chat.message }}</p>
          </div>
        </div>

        <!-- Chat Input -->
        <div class="flex gap-2">
          <input
            v-model="chatMessage"
            type="text"
            class="input-base flex-1"
            placeholder="Say something..."
            @keyup.enter="sendChat"
          />
          <button
            class="btn-primary"
            @click="sendChat"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useLiveStore } from '~/stores/live'
import { LiveStream, StreamChat } from '~/types'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const liveStore = useLiveStore()

const streamId = route.params.id as string
const stream = ref<LiveStream | null>(null)
const chats = reactive<StreamChat[]>([])
const isLoading = ref(false)
const chatMessage = ref('')

onMounted(async () => {
  isLoading.value = true
  const result = await liveStore.getStreamById(streamId)
  if (result.success) {
    stream.value = result.data || null
    const chatsResult = await liveStore.getStreamChats(streamId)
    if (chatsResult.success) {
      chats.push(...(chatsResult.data || []))
    }
  }
  isLoading.value = false
})

const sendChat = async () => {
  if (chatMessage.value.trim() && stream) {
    const result = await liveStore.sendStreamChat(streamId, chatMessage.value)
    if (result.success) {
      chats.push(result.data!)
      chatMessage.value = ''
    }
  }
}
</script>
