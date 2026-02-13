import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '~/utils/api'

export const useAuthStore = defineStore('auth', () => {
    const api = useApi()
    const token = ref(null)
    const user = ref(null)
    const isLoading = ref(false)
    const error = ref(null)

    const isAuthenticated = computed(() => !!token.value && !!user.value)

    const initializeAuth = async () => {
        if (process.client) {
            const savedToken = localStorage.getItem('jwt_token')
            if (savedToken) {
                token.value = savedToken
                await fetchUserProfile()
            }
        }
    }

    const checkAuthStatus = async () => {
        if (process.client) {
            const savedToken = localStorage.getItem('jwt_token')
            if (savedToken) {
                token.value = savedToken
                try {
                    await fetchUserProfile()
                } catch (err) {
                    logout()
                }
            }
        }
    }

    const login = async (credentials) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.post('/auth/login', credentials)
            const { token: newToken, user: newUser } = response.data

            token.value = newToken
            user.value = newUser

            if (process.client) {
                localStorage.setItem('jwt_token', newToken)
                localStorage.setItem('user', JSON.stringify(newUser))
            }

            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Login failed'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const signup = async (data) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.post('/auth/signup', data)
            const { token: newToken, user: newUser } = response.data

            token.value = newToken
            user.value = newUser

            if (process.client) {
                localStorage.setItem('jwt_token', newToken)
                localStorage.setItem('user', JSON.stringify(newUser))
            }

            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Signup failed'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/auth/profile')
            user.value = response.data
            if (process.client) {
                localStorage.setItem('user', JSON.stringify(response.data))
            }
        } catch (err) {
            console.error('Failed to fetch user profile:', err)
            throw err
        }
    }

    const updateProfile = async (data) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.patch('/auth/profile', data)
            user.value = response.data
            if (process.client) {
                localStorage.setItem('user', JSON.stringify(response.data))
            }
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Update failed'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const logout = () => {
        token.value = null
        user.value = null
        error.value = null

        if (process.client) {
            localStorage.removeItem('jwt_token')
            localStorage.removeItem('user')
        }
    }

    return {
        token,
        user,
        isLoading,
        error,
        isAuthenticated,
        initializeAuth,
        checkAuthStatus,
        login,
        signup,
        fetchUserProfile,
        updateProfile,
        logout,
    }
})
