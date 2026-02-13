import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/utils/api'

export const useUsersStore = defineStore('users', () => {
    const api = useApi()

    const users = ref([])
    const currentUser = ref(null)
    const isLoading = ref(false)
    const error = ref(null)

    const searchUsers = async (query) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.get('/users/search', {
                params: { q: query },
            })

            users.value = response.data
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to search users'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const getUserById = async (userId) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.get(`/users/${userId}`)
            currentUser.value = response.data
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to fetch user'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const getFollowers = async (userId) => {
        try {
            const response = await api.get(`/users/${userId}/followers`)
            return { success: true, data: response.data }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to fetch followers' }
        }
    }

    const getFollowing = async (userId) => {
        try {
            const response = await api.get(`/users/${userId}/following`)
            return { success: true, data: response.data }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to fetch following' }
        }
    }

    const followUser = async (userId) => {
        try {
            const response = await api.post(`/users/${userId}/follow`)
            return { success: true, data: response.data }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to follow user' }
        }
    }

    const unfollowUser = async (userId) => {
        try {
            await api.post(`/users/${userId}/unfollow`)
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to unfollow user' }
        }
    }

    const getFollowRequests = async () => {
        try {
            const response = await api.get('/users/follow-requests')
            return { success: true, data: response.data }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to fetch follow requests' }
        }
    }

    const approveFollowRequest = async (requestId) => {
        try {
            await api.post(`/users/follow-requests/${requestId}/approve`)
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to approve request' }
        }
    }

    const rejectFollowRequest = async (requestId) => {
        try {
            await api.post(`/users/follow-requests/${requestId}/reject`)
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to reject request' }
        }
    }

    const updateUserProfile = async (data) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.put('/users/profile', data)
            currentUser.value = response.data
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to update profile'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    return {
        users,
        currentUser,
        isLoading,
        error,
        searchUsers,
        getUserById,
        getFollowers,
        getFollowing,
        followUser,
        unfollowUser,
        getFollowRequests,
        approveFollowRequest,
        rejectFollowRequest,
        updateUserProfile,
    }
})
