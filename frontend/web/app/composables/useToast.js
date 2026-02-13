import { ref } from 'vue'

export const useToast = () => {
    const toasts = ref([])

    const showToast = (title, message, type = 'info', duration = 3000) => {
        const id = Date.now().toString()
        toasts.value.push({ id, title, message, type })

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration)
        }

        return id
    }

    const removeToast = (id) => {
        const index = toasts.value.findIndex((t) => t.id === id)
        if (index !== -1) {
            toasts.value.splice(index, 1)
        }
    }

    return {
        toasts,
        showToast,
        removeToast,
    }
}
