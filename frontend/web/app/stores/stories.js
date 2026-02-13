import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/utils/api'

export const useStoriesStore = defineStore('stories', () => {
    const api = useApi()

    const stories = ref([])
    const userStories = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    const getStories = async () => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.get('/stories')
            stories.value = response.data
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to fetch stories'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const getUserStories = async (userId) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.get(`/stories/user/${userId}`)
            userStories.value = response.data
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to fetch user stories'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const getStoryById = async (storyId) => {
        try {
            const response = await api.get(`/stories/${storyId}`)
            return { success: true, data: response.data }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to fetch story' }
        }
    }

    const createStory = async (data) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.post('/stories', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            userStories.value.push(response.data)
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to create story'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const deleteStory = async (storyId) => {
        isLoading.value = true
        error.value = null

        try {
            await api.delete(`/stories/${storyId}`)
            userStories.value = userStories.value.filter((s) => s.id !== storyId)
            return { success: true }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to delete story'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const viewStory = async (storyId) => {
        try {
            await api.post(`/stories/${storyId}/view`)
            const story = stories.value.find((s) => s.id === storyId)
            if (story) {
                story.viewed = true
            }
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to view story' }
        }
    }

    return {
        stories,
        userStories,
        isLoading,
        error,
        getStories,
        getUserStories,
        getStoryById,
        createStory,
        deleteStory,
        viewStory,
    }
})
