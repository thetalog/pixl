import { ref } from 'vue'
import { useApi } from '~/utils/api'

export const useSearch = () => {
    const api = useApi()
    const query = ref('')
    const results = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    const search = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            results.value = []
            return
        }

        isLoading.value = true
        error.value = null

        try {
            const response = await api.get('/search', {
                params: { q: searchQuery },
            })
            results.value = response.data
        } catch (err) {
            error.value = err?.response?.data?.message || 'Search failed'
        } finally {
            isLoading.value = false
        }
    }

    return {
        query,
        results,
        isLoading,
        error,
        search,
    }
}
