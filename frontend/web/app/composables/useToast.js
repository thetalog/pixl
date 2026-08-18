export function useToast() {
  const toasts = useState('pixl-toasts', () => [])

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function show(message, type = 'info') {
    const text = String(message || '').trim()
    if (!text) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    toasts.value = [...toasts.value, { id, message: text, type }]
    setTimeout(() => dismiss(id), 3000)
    return id
  }

  return {
    toasts,
    show,
    dismiss,
    error: (message) => show(message, 'error'),
    success: (message) => show(message, 'success'),
  }
}
