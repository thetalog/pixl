<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">Messages</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 h-96">
      <!-- Conversations List -->
      <div class="card-base md:col-span-1 overflow-y-auto">
        <div class="space-y-2">
          <div
            v-for="conversation in conversations"
            :key="conversation.id"
            class="p-3 rounded-lg hover:bg-primary cursor-pointer transition-colors"
            @click="selectConversation(conversation.id)"
          >
            <p class="font-semibold">{{ conversation.username }}</p>
            <p class="text-sm text-gray-400 truncate">{{ conversation.lastMessage }}</p>
          </div>
          <div v-if="conversations.length === 0" class="text-center py-8">
            <p class="text-gray-400">No conversations yet</p>
          </div>
        </div>
      </div>

      <!-- Chat Window -->
      <div v-if="selectedConversation" class="card-base md:col-span-2 flex flex-col">
        <!-- Messages -->
        <div class="flex-1 overflow-y-auto mb-4 space-y-2">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="[
              'flex mb-2',
              message.senderId === currentUserId ? 'justify-end' : 'justify-start'
            ]"
          >
            <div
              :class="[
                'px-4 py-2 rounded-lg max-w-xs',
                message.senderId === currentUserId
                  ? 'bg-accent text-primary'
                  : 'bg-primary text-white'
              ]"
            >
              {{ message.content }}
            </div>
          </div>
        </div>

        <!-- Message Input -->
        <div class="flex gap-2">
          <input
            v-model="newMessage"
            type="text"
            class="input-base flex-1"
            placeholder="Type a message..."
            @keyup.enter="sendMessage"
          />
          <button
            class="btn-primary"
            @click="sendMessage"
          >
            Send
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="card-base md:col-span-2 flex items-center justify-center">
        <p class="text-gray-400">Select a conversation to start messaging</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { ChatMessage } from '~/types'

definePageMeta({
  layout: 'default'
})

const authStore = useAuthStore()

const conversations = reactive<any[]>([
  { id: '1', username: 'User 1', lastMessage: 'Hey, how are you?' },
  { id: '2', username: 'User 2', lastMessage: 'See you later!' }
])

const messages = reactive<ChatMessage[]>([
  {
    id: '1',
    senderId: 'other',
    receiverId: authStore.user?.id || '',
    content: 'Hey, how are you?',
    createdAt: new Date().toISOString(),
    read: true
  }
])

const selectedConversation = ref<string | null>(null)
const newMessage = ref('')
const currentUserId = ref(authStore.user?.id)

const selectConversation = (id: string) => {
  selectedConversation.value = id
}

const sendMessage = () => {
  if (newMessage.value.trim()) {
    messages.push({
      id: Date.now().toString(),
      senderId: currentUserId.value || '',
      receiverId: selectedConversation.value || '',
      content: newMessage.value,
      createdAt: new Date().toISOString(),
      read: true
    })
    newMessage.value = ''
  }
}
</script>
