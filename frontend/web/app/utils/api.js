import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

let apiClient = null

export const createApiClient = () => {
    const config = useRuntimeConfig()

    apiClient = axios.create({
        baseURL: config.public.apiBase,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        },
    })

    apiClient.interceptors.request.use((config) => {
        const authStore = useAuthStore()
        const token = authStore.token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    })

    apiClient.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error?.response?.status === 401) {
                const authStore = useAuthStore()
                authStore.logout()
                navigateTo('/login')
            }
            return Promise.reject(error)
        }
    )

    return apiClient
}

export const getApiClient = () => {
    if (!apiClient) {
        return createApiClient()
    }
    return apiClient
}

export const useApi = () => {
    const client = getApiClient()

    return {
        get: (url, config) => client.get(url, config),
        post: (url, data, config) => client.post(url, data, config),
        put: (url, data, config) => client.put(url, data, config),
        patch: (url, data, config) => client.patch(url, data, config),
        delete: (url, config) => client.delete(url, config),
    }
}
