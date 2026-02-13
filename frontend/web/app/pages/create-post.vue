<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">Create Post</h1>

    <div class="card-base max-w-2xl">
      <form @submit.prevent="handleSubmit">
        <!-- Content -->
        <div class="mb-6">
          <label class="block text-sm font-semibold mb-2">What's on your mind?</label>
          <textarea
            v-model="content"
            class="input-base w-full"
            rows="6"
            placeholder="Share your thoughts..."
          ></textarea>
        </div>

        <!-- Media Upload -->
        <div class="mb-6">
          <label class="block text-sm font-semibold mb-2">Add Media</label>
          <div
            class="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-accent transition-colors"
            @click="$refs.fileInput.click()"
          >
            <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <p class="text-gray-400">Click to upload or drag and drop</p>
            <p class="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,video/*"
            class="hidden"
            @change="handleFileUpload"
          />

          <!-- Media Preview -->
          <div v-if="mediaFiles.length > 0" class="mt-4 grid grid-cols-2 gap-4">
            <div
              v-for="(file, index) in mediaFiles"
              :key="index"
              class="relative"
            >
              <img
                :src="file.preview"
                :alt="file.name"
                class="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                @click="removeMedia(index)"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Submit Buttons -->
        <div class="flex gap-2 justify-end">
          <button
            type="button"
            class="btn-secondary"
            @click="$router.back()"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isLoading || !content.trim()"
            class="btn-primary disabled:opacity-50"
          >
            {{ isLoading ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '~/stores/posts'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const postsStore = usePostsStore()

const content = ref('')
const mediaFiles = ref<{ file: File, preview: string, name: string }[]>([])
const isLoading = ref(false)

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    Array.from(input.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        mediaFiles.value.push({
          file,
          preview: e.target?.result as string,
          name: file.name
        })
      }
      reader.readAsDataURL(file)
    })
  }
}

const removeMedia = (index: number) => {
  mediaFiles.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (!content.value.trim()) return

  isLoading.value = true

  // Create FormData for multipart upload
  const formData = new FormData()
  formData.append('content', content.value)
  
  mediaFiles.value.forEach((file, index) => {
    formData.append(`media`, file.file)
  })

  const result = await postsStore.createPost(formData)
  isLoading.value = false

  if (result.success) {
    router.push('/home')
  }
}
</script>
