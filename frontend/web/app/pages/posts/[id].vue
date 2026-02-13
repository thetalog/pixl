<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Back Button -->
    <NuxtLink to="/home" class="flex items-center gap-2 text-accent hover:underline mb-6">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
      Back
    </NuxtLink>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center">
      <LoadingSpinner visible message="Loading post..." />
    </div>

    <!-- Post Content -->
    <div v-else-if="post">
      <PostCard
        :post="post"
        :user="post.user || {}"
        @like="handleLike"
        @comment="showCommentForm = true"
      />

      <!-- Comments Section -->
      <div class="mt-8">
        <h2 class="text-2xl font-bold mb-6">Comments ({{ post.comments || 0 }})</h2>

        <!-- Comment Form -->
        <form v-if="showCommentForm" @submit.prevent="postComment" class="card-base mb-6">
          <textarea
            v-model="commentText"
            class="input-base w-full mb-4"
            placeholder="Write a comment..."
            rows="3"
          ></textarea>
          <div class="flex gap-2 justify-end">
            <button
              type="button"
              class="btn-secondary"
              @click="showCommentForm = false"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Post Comment
            </button>
          </div>
        </form>
        <button
          v-else
          class="btn-primary mb-6"
          @click="showCommentForm = true"
        >
          Add Comment
        </button>

        <!-- Comments List -->
        <div class="space-y-4">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="card-base"
          >
            <div class="flex items-center gap-3 mb-2">
              <img
                v-if="comment.user?.avatar"
                :src="comment.user.avatar"
                :alt="comment.user.username"
                class="w-8 h-8 rounded-full object-cover"
              />
              <div v-else class="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <span class="text-white text-xs font-bold">{{ comment.user?.username?.charAt(0).toUpperCase() }}</span>
              </div>
              <div>
                <p class="font-semibold">{{ comment.user?.username }}</p>
                <p class="text-xs text-gray-400">{{ formatDate(comment.createdAt) }}</p>
              </div>
            </div>
            <p>{{ comment.content }}</p>
          </div>

          <div v-if="comments.length === 0" class="text-center py-8">
            <p class="text-gray-400">No comments yet. Be the first!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else class="text-center py-12">
      <p class="text-gray-400">Post not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { usePostsStore } from '~/stores/posts'
import { Post, Comment } from '~/types'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const postsStore = usePostsStore()

const postId = route.params.id as string
const post = ref<Post | null>(null)
const comments = reactive<Comment[]>([])
const isLoading = ref(false)
const showCommentForm = ref(false)
const commentText = ref('')

onMounted(async () => {
  isLoading.value = true
  const result = await postsStore.getPostById(postId)
  if (result.success) {
    post.value = result.data || null
  }
  isLoading.value = false
})

const handleLike = async () => {
  if (post.value?.liked) {
    await postsStore.unlikePost(postId)
  } else {
    await postsStore.likePost(postId)
  }
  if (post.value) {
    post.value.liked = !post.value.liked
  }
}

const postComment = async () => {
  if (commentText.value.trim()) {
    // Add comment to local state (replace with API call)
    comments.push({
      id: Date.now().toString(),
      postId: postId,
      userId: '',
      content: commentText.value,
      createdAt: new Date().toISOString()
    })
    commentText.value = ''
    showCommentForm.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>
