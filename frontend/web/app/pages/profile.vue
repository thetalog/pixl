<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">Profile</h1>

    <!-- Loading state -->
    <div v-if="usersStore.isLoading && !usersStore.currentUser" class="flex justify-center">
      <LoadingSpinner visible message="Loading profile..." />
    </div>

    <!-- Profile Content -->
    <div v-else-if="usersStore.currentUser" class="space-y-8">
      <!-- Profile Header -->
      <div class="card-base flex items-center gap-8">
        <img
          v-if="usersStore.currentUser.avatar"
          :src="usersStore.currentUser.avatar"
          :alt="usersStore.currentUser.username"
          class="w-32 h-32 rounded-full object-cover"
        />
        <div v-else class="w-32 h-32 rounded-full bg-accent flex items-center justify-center">
          <span class="text-white font-bold text-4xl">{{ usersStore.currentUser.username?.charAt(0).toUpperCase() }}</span>
        </div>

        <div class="flex-1">
          <h2 class="text-3xl font-bold mb-2">{{ usersStore.currentUser.username }}</h2>
          <p class="text-gray-400 mb-4">{{ usersStore.currentUser.bio }}</p>
          
          <div class="flex gap-6 mb-6">
            <div class="text-center">
              <p class="text-2xl font-bold">{{ userPostCount }}</p>
              <p class="text-gray-400">Posts</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold">{{ usersStore.currentUser.followers || 0 }}</p>
              <p class="text-gray-400">Followers</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold">{{ usersStore.currentUser.following || 0 }}</p>
              <p class="text-gray-400">Following</p>
            </div>
          </div>

          <div class="flex gap-4">
            <button
              v-if="isOwnProfile"
              class="btn-primary"
              @click="editProfile"
            >
              Edit Profile
            </button>
            <button
              v-else
              class="btn-primary"
              @click="toggleFollow"
            >
              {{ isFollowing ? 'Unfollow' : 'Follow' }}
            </button>
          </div>
        </div>
      </div>

      <!-- User Posts -->
      <div>
        <h3 class="text-2xl font-bold mb-6">Posts</h3>
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
          <p class="text-gray-400">No posts yet</p>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <Modal
      v-if="showEditModal"
      title="Edit Profile"
      confirm-text="Save"
      :loading="usersStore.isLoading"
      @confirm="saveProfile"
      @cancel="showEditModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold mb-2">Username</label>
          <input
            v-model="editFormData.username"
            type="text"
            class="input-base w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-2">Bio</label>
          <textarea
            v-model="editFormData.bio"
            class="input-base w-full"
            rows="4"
          ></textarea>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useUsersStore } from '~/stores/users'
import { usePostsStore } from '~/stores/posts'
import { User } from '~/types'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const postsStore = usePostsStore()

const userId = computed(() => route.params.id as string || authStore.user?.id)
const isOwnProfile = computed(() => userId.value === authStore.user?.id)
const isFollowing = ref(false)
const showEditModal = ref(false)
const userPostCount = ref(0)

const editFormData = ref({
  username: '',
  bio: ''
})

onMounted(async () => {
  if (userId.value) {
    await usersStore.getUserById(userId.value)
    await postsStore.getUserPosts(userId.value)
    userPostCount.value = postsStore.userPosts.length

    if (editFormData.value.username === '' && usersStore.currentUser) {
      editFormData.value.username = usersStore.currentUser.username
      editFormData.value.bio = usersStore.currentUser.bio || ''
    }
  }
})

const editProfile = () => {
  showEditModal.value = true
}

const saveProfile = async () => {
  const result = await usersStore.updateUserProfile(editFormData.value)
  if (result.success) {
    showEditModal.value = false
  }
}

const toggleFollow = async () => {
  if (userId.value && userId.value !== authStore.user?.id) {
    if (isFollowing.value) {
      await usersStore.unfollowUser(userId.value)
    } else {
      await usersStore.followUser(userId.value)
    }
    isFollowing.value = !isFollowing.value
  }
}

const handleLike = async (postId: string) => {
  const post = postsStore.userPosts.find(p => p.id === postId)
  if (post?.liked) {
    await postsStore.unlikePost(postId)
  } else {
    await postsStore.likePost(postId)
  }
}
</script>
