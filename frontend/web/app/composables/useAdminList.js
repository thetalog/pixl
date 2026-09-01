export function useAdminList(endpoint, { extra = () => ({}) } = {}) {
  const admin = useAdmin()
  const toast = useToast()
  const query = ref({ q: '', page: 1, limit: 20 })
  const rows = ref([])
  const total = ref(0)
  const pages = ref(1)
  const loading = ref(false)
  const selected = ref([])

  async function load() {
    loading.value = true
    try {
      const data = await admin.get(endpoint, { ...query.value, ...extra() })
      rows.value = data.items || data.flags || data.announcements || []
      total.value = data.total || rows.value.length
      pages.value = data.pages || 1
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to load')
      rows.value = []
    } finally {
      loading.value = false
    }
  }

  watch(query, () => {
    load()
  }, { deep: true })

  onMounted(load)

  return { admin, query, rows, total, pages, loading, selected, load }
}
