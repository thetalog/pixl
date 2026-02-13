import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '~/utils/api'

export const useNotificationStore = defineStore('notifications', () => {
    const api = useApi()

    const notifications = ref([])
    const unreadCount = ref(0)
    const isLoading = ref(false)
    const error = ref(null)

    const getNotifications = async () => {
        isLoading.value = true
        error.value = null

        try {
            const response = await api.get('/notifications')
            notifications.value = response.data
            unreadCount.value = response.data.filter((n) => !n.read).length
            return { success: true, data: response.data }
        } catch (err) {
            error.value = err?.response?.data?.message || 'Failed to fetch notifications'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`)
            const notification = notifications.value.find((n) => n.id === notificationId)
            if (notification && !notification.read) {
                notification.read = true
                unreadCount.value = Math.max(0, unreadCount.value - 1)
            }
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to mark as read' }
        }
    }

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/mark-all-read')
            notifications.value.forEach((n) => {
                n.read = true
            })
            unreadCount.value = 0
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to mark all as read' }
        }
    }

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`)
            notifications.value = notifications.value.filter((n) => n.id !== notificationId)
            return { success: true }
        } catch (err) {
            return { success: false, error: err?.response?.data?.message || 'Failed to delete notification' }
        }
    }

    const addNotification = (notification) => {
        notifications.value.unshift(notification)
        if (!notification.read) {
            unreadCount.value += 1
        }
    }

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        getNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
    }
})
