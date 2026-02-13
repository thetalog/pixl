<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center">
      <LoadingSpinner visible message="Loading profile..." />
    </div>

    <!-- Back Button -->
    <NuxtLink v-else to="/explore" class="flex items-center gap-2 text-accent hover:underline mb-6">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
      Back
    </NuxtLink>

    <!-- Profile Content -->
    <div v-if="usersStore.currentUser" class="space-y-8">
      <!-- Profile Header -->
      <div class="card-base flex items-center gap-8">
        <img
          v-if="usersStore.currentUser.avatar"
          :src="usersStore.currentUser.avatar"
          :alt="usersStore.currentUser.username"
          class="w-40 h-40 rounded-full object-cover"
        />
        <div v-else class="w-40 h-40 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <span class="text-white font-bold text-6xl">{{ usersStore.currentUser.username?.charAt(0).toUpperCase() }}</span>
        </div>

        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-2">{{ usersStore.currentUser.username }}</h1>
          <p v-if="usersStore.currentUser.isVerified" class="flex items-center gap-2 text-accent mb-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Verified
          </p>
          <p class="text-gray-400 mb-4 max-w-lg">{{ usersStore.currentUser.bio }}</p>

          <div class="flex gap-8 mb-6">
            <div>
              <p class="text-3xl font-bold">{{ userPostCount }}</p>
              <p class="text-gray-400">Posts</p>
            </div>
            <div>
              <p class="text-3xl font-bold">{{ usersStore.currentUser.followers || 0 }}</p>
              <p class="text-gray-400">Followers</p>
            </div>
            <div>
              <p class="text-3xl font-bold">{{ usersStore.currentUser.following || 0 }}</p>
              <p class="text-gray-400">Following</p>
            </div>
          </div>

          <button class="btn-primary">Follow</button>
        </div>
      </div>

      <!-- User Posts -->
      <div>
        <h2 class="text-2xl font-bold mb-6">Posts</h2>
        <div v-if="postsStore.userPosts.length > 0" class="space-y-6">
          <PostCard
            v-for="post in postsStore.userPosts"
            :key="post.id"
            :post="post"
            :user="usersStore.currentUser!"
            @like="handleLike(post.id)"
            @comment="navigateTo(`/posts/${post.id}`)"
          />
        </div>
        <div v-else class="text-center py-12">
          <p class="text-gray-400">This user hasn't posted yet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUsersStore } from '~/stores/users'
import { usePostsStore } from '~/stores/posts'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const usersStore = useUsersStore()
const postsStore = usePostsStore()

const userId = route.params.id as string
const isLoading = ref(false)
const userPostCount = ref(0)

onMounted(async () => {
  isLoading.value = true
  await usersStore.getUserById(userId)
  await postsStore.getUserPosts(userId)
  userPostCount.value = postsStore.userPosts.length
  isLoading.value = false
})

const handleLike = async (postId: string) => {
  const post = postsStore.userPosts.find(p => p.id === postId)
  if (post?.liked) {
    await postsStore.unlikePost(postId)
  } else {
    await postsStore.likePost(postId)
  }
}
</script>
