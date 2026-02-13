import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/utils/api'

export const usePostsStore = defineStore('posts', () => {
    const api = useApi()

    const posts = ref([])
    const userPosts = ref([])
    const isLoading = ref(false)
    const error = ref(null)
    const currentPage = ref(1)
    const totalPosts = ref(0)
    const limit = ref(10)

    const getPosts = async (page = 1, pageLimit = 10) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.get('/posts', {
                params: { page, limit: pageLimit },
            })

            posts.value = response.data.data
            totalPosts.value = response.data.total
            currentPage.value = page
            limit.value = pageLimit

            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to fetch posts'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const getFollowedPosts = async (page = 1, pageLimit = 10) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.get('/posts/followed', {
                params: { page, limit: pageLimit },
            })

            posts.value = response.data.data
            totalPosts.value = response.data.total
            currentPage.value = page
            limit.value = pageLimit

            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to fetch followed posts'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const getUserPosts = async (userId, page = 1) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.get(`/posts/user/${userId}`, {
                params: { page, limit: 10 },
            })

            userPosts.value = response.data.data
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to fetch user posts'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const getPostById = async (postId) => {
        try {
            const response = await api.get(`/posts/${postId}`)
            return { success: true, data: response.data }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to fetch post' }
        }
    }

    const createPost = async (data) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.post('/posts', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })

            posts.value.unshift(response.data)
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to create post'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const updatePost = async (postId, data) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.put(`/posts/${postId}`, data)

            const index = posts.value.findIndex((p) => p.id === postId)
            if (index !== -1) {
                posts.value[index] = response.data
            }

            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to update post'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const deletePost = async (postId) => {
        isLoading.value = true
        error.value = null

        try {
            await api.delete(`/posts/${postId}`)
            posts.value = posts.value.filter((p) => p.id !== postId)
            return { success: true }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to delete post'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const likePost = async (postId) => {
        try {
            await api.post(`/posts/${postId}/like`)
            const post = posts.value.find((p) => p.id === postId)
            if (post) {
                post.liked = true
                if (post.likes) post.likes += 1
            }
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to like post' }
        }
    }

    const unlikePost = async (postId) => {
        try {
            await api.post(`/posts/${postId}/unlike`)
            const post = posts.value.find((p) => p.id === postId)
            if (post) {
                post.liked = false
                if (post.likes) post.likes -= 1
            }
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to unlike post' }
        }
    }

    return {
        posts,
        userPosts,
        isLoading,
        error,
        currentPage,
        totalPosts,
        limit,
        getPosts,
        getFollowedPosts,
        getUserPosts,
        getPostById,
        createPost,
        updatePost,
        deletePost,
        likePost,
        unlikePost,
    }
})
