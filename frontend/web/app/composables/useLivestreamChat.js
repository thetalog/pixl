export function useLivestreamChat(socket, { streamId } = {}) {
  const comments = ref([])
  const sending = ref(false)

  function ingest(message) {
    if (message?.type === 'CHAT_HISTORY' && Array.isArray(message.payload?.messages)) {
      comments.value = message.payload.messages.map((payload) => ({
        id: payload.id,
        text: payload.message || payload.text || '',
        userId: payload.userId,
        userName: payload.userName,
        avatarUrl: payload.avatarUrl,
        createdAt: payload.timestamp,
      }))
      return
    }
    if (message?.type === 'CHAT_MESSAGE') {
      const payload = message.payload || {}
      const next = {
        id: payload.id || `${Date.now()}`,
        text: payload.message || payload.text || '',
        userId: payload.userId || message.senderId,
        userName: payload.userName,
        avatarUrl: payload.avatarUrl,
        createdAt: payload.timestamp,
      }
      if (comments.value.some((row) => row.id === next.id)) return
      comments.value = [
        ...comments.value.filter((row) => !(String(row.id).startsWith('local-') && row.text === next.text)),
        next,
      ].slice(-300)
    }
    if (message?.type === 'CHAT_DELETE') {
      const id = message.payload?.id
      comments.value = comments.value.filter((row) => row.id !== id)
    }
  }

  async function send(text) {
    const body = String(text || '').trim()
    if (!body || sending.value) return
    sending.value = true
    try {
      comments.value = [
        ...comments.value,
        {
          id: `local-${Date.now()}`,
          text: body,
          userName: 'you',
        },
      ].slice(-300)
      socket.send('CHAT_MESSAGE', { message: body }, { streamId: unref(streamId) })
    } finally {
      sending.value = false
    }
  }

  function remove(id) {
    socket.send('CHAT_DELETE', { id }, { streamId: unref(streamId) })
  }

  return { comments, sending, ingest, send, remove }
}
