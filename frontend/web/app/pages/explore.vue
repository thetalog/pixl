<template>
  <div class="max-w-6xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">Explore</h1>

    <!-- Search bar -->
    <div class="mb-8">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search users or posts..."
        class="input-base w-full"
        @input="handleSearch"
      />
    </div>

    <!-- Users Results -->
    <div v-if="searchResults.users.length > 0" class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Users</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="user in searchResults.users"
          :key="user.id"
          class="card-base text-center"
        >
          <img
            v-if="user.avatar"
            :src="user.avatar"
            :alt="user.username"
            class="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
          />
          <div v-else class="w-20 h-20 rounded-full mx-auto mb-4 bg-accent flex items-center justify-center">
            <span class="text-white font-bold text-2xl">{{ user.username?.charAt(0).toUpperCase() }}</span>
          </div>
          <p class="font-bold text-lg">{{ user.username }}</p>
          <p class="text-sm text-gray-400 mb-4">{{ user.bio }}</p>
          <NuxtLink :to="`/profile/${user.id}`" class="btn-primary text-center">
            View Profile
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Posts Results -->
    <div v-if="searchResults.posts.length > 0" class="mb-12">
      <h2 class="text-2xl font-bold mb-6">Posts</h2>
      <div class="space-y-6">
        <PostCard
          v-for="post in searchResults.posts"
          :key="post.id"
          :post="post"
          :user="post.user || {}"
          @like="handleLike(post.id)"
          @comment="navigateTo(`/posts/${post.id}`)"
        />
      </div>
    </div>

    <!-- Trending -->
    <div v-if="searchQuery === ''">
      <h2 class="text-2xl font-bold mb-6">Popular Posts</h2>
      <div class="space-y-6">
        <PostCard
          v-for="post in postsStore.posts"
          :key="post.id"
          :post="post"
          :user="post.user || {}"
          @like="handleLike(post.id)"
          @comment="navigateTo(`/posts/${post.id}`)"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="searchQuery !== '' && searchResults.users.length === 0 && searchResults.posts.length === 0" class="text-center py-12">
      <p class="text-gray-400">No results found for "{{ searchQuery }}"</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { usePostsStore } from '~/stores/posts'
import { useUsersStore } from '~/stores/users'
import { User, Post } from '~/types'

definePageMeta({
  layout: 'default'
})

const postsStore = usePostsStore()
const usersStore = useUsersStore()

const searchQuery = ref('')
const searchResults = reactive<{ users: User[], posts: Post[] }>({
  users: [],
  posts: []
})

onMounted(async () => {
  await postsStore.getPosts()
})

const handleSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.users = []
    searchResults.posts = []
    return
  }

  const [usersRes, postsRes] = await Promise.all([
    usersStore.searchUsers(searchQuery.value),
    postsStore.getPosts()
  ])

  if (usersRes.success) {
    searchResults.users = usersRes.data || []
  }

  if (postsRes.success) {
    // Filter posts by content matching search query
    searchResults.posts = postsRes.data?.data?.filter(post =>
      post.content.toLowerCase().includes(searchQuery.value.toLowerCase())
    ) || []
  }
}

const handleLike = async (postId: string) => {
  const post = postsStore.posts.find(p => p.id === postId)
  if (post?.liked) {
    await postsStore.unlikePost(postId)
  } else {
    await postsStore.likePost(postId)
  }
}
</script>
