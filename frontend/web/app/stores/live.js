import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/utils/api'

export const useLiveStore = defineStore('live', () => {
    const api = useApi()

    const liveStreams = ref([])
    const currentStream = ref(null)
    const streamChats = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    const getLiveStreams = async () => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.get('/live/streams')
            liveStreams.value = response.data
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to fetch streams'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const getStreamById = async (streamId) => {
        try {
            const response = await api.get(`/live/streams/${streamId}`)
            currentStream.value = response.data
            return { success: true, data: response.data }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to fetch stream' }
        }
    }

    const createStream = async (data) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.post('/live/streams', data)
            liveStreams.value.push(response.data)
            currentStream.value = response.data
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to create stream'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const endStream = async (streamId) => {
        try {
            await api.post(`/live/streams/${streamId}/end`)
            const stream = liveStreams.value.find((s) => s.id === streamId)
            if (stream) {
                stream.status = 'ended'
            }
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to end stream' }
        }
    }

    const joinStream = async (streamId) => {
        try {
            await api.post(`/live/streams/${streamId}/join`)
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to join stream' }
        }
    }

    const getStreamChats = async (streamId) => {
        try {
            const response = await api.get(`/live/streams/${streamId}/chats`)
            streamChats.value = response.data
            return { success: true, data: response.data }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to fetch chats' }
        }
    }

    const sendStreamChat = async (streamId, message) => {
        try {
            const response = await api.post(`/live/streams/${streamId}/chat`, { message })
            streamChats.value.push(response.data)
            return { success: true, data: response.data }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to send message' }
        }
    }

    return {
        liveStreams,
        currentStream,
        streamChats,
        isLoading,
        error,
        getLiveStreams,
        getStreamById,
        createStream,
        endStream,
        joinStream,
        getStreamChats,
        sendStreamChat,
    }
})
