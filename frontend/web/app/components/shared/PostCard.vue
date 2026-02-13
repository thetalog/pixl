<template>
  <div class="card-base">
    <div class="flex items-center gap-3 mb-4">
      <img
        v-if="user.avatar"
        :src="user.avatar"
        :alt="user.username"
        class="w-12 h-12 rounded-full object-cover"
      />
      <div v-else class="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
        <span class="text-white font-bold">{{ user.username?.charAt(0).toUpperCase() }}</span>
      </div>
      <div class="flex-1">
        <p class="font-semibold">{{ user.username }}</p>
        <p class="text-sm text-gray-400">{{ formatDate(post.createdAt) }}</p>
      </div>
      <slot name="actions"></slot>
    </div>

    <p class="mb-4">{{ post.content }}</p>

    <!-- Media Carousel -->
    <div v-if="post.media && post.media.length > 0" class="mb-4">
      <div
        v-if="post.media.length === 1"
        class="w-full rounded-lg overflow-hidden"
        :style="{ maxHeight: '400px' }"
      >
        <img
          v-if="post.media[0].type === 'image'"
          :src="post.media[0].url"
          :alt="post.content"
          class="w-full h-full object-cover"
        />
        <video
          v-else
          :src="post.media[0].url"
          controls
          class="w-full h-full"
        ></video>
      </div>
      <div v-else class="grid grid-cols-2 gap-2">
        <div
          v-for="(media, index) in post.media.slice(0, 4)"
          :key="index"
          class="relative overflow-hidden rounded-lg"
          :style="{ aspectRatio: '1/1' }"
        >
          <img
            v-if="media.type === 'image'"
            :src="media.url"
            :alt="post.content"
            class="w-full h-full object-cover"
          />
          <video
            v-else
            :src="media.url"
            class="w-full h-full object-cover"
          ></video>
          <div
            v-if="index === 3 && post.media.length > 4"
            class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <span class="text-white font-bold text-lg">+{{ post.media.length - 4 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-4 text-gray-400 text-sm">
      <button
        class="flex items-center gap-2 hover:text-accent transition-colors"
        @click="$emit('like')"
      >
        <svg
          :class="['w-5 h-5', { 'fill-current text-accent': post.liked }]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        </svg>
        {{ post.likes || 0 }}
      </button>
      <button
        class="flex items-center gap-2 hover:text-accent transition-colors"
        @click="$emit('comment')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {{ post.comments || 0 }}
      </button>
      <button
        class="flex items-center gap-2 hover:text-accent transition-colors"
        @click="$emit('share')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C9.589 12.438 10.5 11.5 12 11.5c2.21 0 4 1.79 4 4s-1.79 4-4 4c-1.5 0-2.411-.938-3.316-1.842m0-11.08C9.589 2.438 10.5 1.5 12 1.5c2.21 0 4 1.79 4 4s-1.79 4-4 4c-1.5 0-2.411-.938-3.316-1.842m14.956 12a6 6 0 01-9.684 5.158M3 14.316a6 6 0 009.684-5.158"></path>
        </svg>
        {{ post.shares || 0 }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Post, User } from '~/types'

defineProps({
  post: {
    type: Object as () => Post,
    required: true
  },
  user: {
    type: Object as () => User,
    required: true
  }
})

defineEmits(['like', 'comment', 'share'])

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
