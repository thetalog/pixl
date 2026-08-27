export function useLivestreamViewer() {
  const live = useLivestream()
  const socket = useLivestreamSocket()
  const webrtc = useWebRTC()
  const chat = useLivestreamChat(socket)
  const toast = useToast()

  const stream = ref(null)
  const session = ref(null)
  const viewerCount = ref(0)
  const likeCount = ref(0)
  const liveStatus = ref('CREATED')
  const ended = ref(false)
  const joining = ref(false)

  let off = null
  let iceServers = []
  let subscribed = false
  let awaitingOffer = false
  let joinRetry = null

  function attachPeer() {
    webrtc.attachPeer(iceServers, {
      onCandidate: (candidate) => socket.send('ICE_CANDIDATE', candidate),
    })
  }

  function tryJoin() {
    if (subscribed || awaitingOffer) return
    awaitingOffer = true
    socket.send('JOIN_STREAM')
  }

  function scheduleJoinRetry() {
    if (subscribed || joinRetry) return
    joinRetry = setTimeout(() => {
      joinRetry = null
      if (!subscribed) tryJoin()
    }, 1500)
  }

  function handle(message) {
    chat.ingest(message)
    if (message.type === 'ICE_SERVERS' && message.payload?.iceServers) {
      iceServers = message.payload.iceServers
    }
    if (message.type === 'SUBSCRIBER_OFFER' && message.payload?.sdp) {
      subscribed = true
      awaitingOffer = false
      if (joinRetry) {
        clearTimeout(joinRetry)
        joinRetry = null
      }
      webrtc.applyRemoteOffer(message.payload.sdp).then((answer) => {
        if (!answer?.sdp) return
        socket.send('ANSWER', { sdp: answer.sdp, type: 'answer' })
      }).catch((err) => toast.error(err.message || 'Could not subscribe'))
    }
    if (message.type === 'ICE_CANDIDATE') {
      webrtc.addIce(message.payload)
    }
    if (message.type === 'VIEWER_COUNT') {
      viewerCount.value = Number(message.payload?.viewerCount || 0)
    }
    if (message.type === 'REACTION') {
      likeCount.value = Number(message.payload?.total || likeCount.value)
    }
    if (message.type === 'STREAM_STARTED') {
      liveStatus.value = 'LIVE'
      if (joinRetry) {
        clearTimeout(joinRetry)
        joinRetry = null
      }
      tryJoin()
    }
    if (message.type === 'STREAM_ENDED') {
      ended.value = true
      liveStatus.value = 'ENDED'
    }
    if (message.type === 'READY') {
      subscribed = false
      awaitingOffer = false
      attachPeer()
      tryJoin()
    }
    if (message.type === 'ERROR') {
      const text = message.payload?.message || 'Live error'
      awaitingOffer = false
      if (text.includes('not publishing yet')) {
        scheduleJoinRetry()
        return
      }
      if (text.includes('WebRTC negotiation failed') && !subscribed) {
        scheduleJoinRetry()
        return
      }
      toast.error(text)
    }
  }

  async function watch(liveId) {
    joining.value = true
    try {
      const joined = await live.join(liveId)
      stream.value = joined.stream || joined
      session.value = joined.session || joined.stream?.session
      iceServers = session.value?.iceServers || []
      liveStatus.value = stream.value?.status || 'LIVE'
      viewerCount.value = Number(stream.value?.viewerCount || 0)
      likeCount.value = Number(stream.value?.likeCount || 0)
      const existing = stream.value?.comments
      if (Array.isArray(existing) && existing.length) {
        chat.ingest({
          type: 'CHAT_HISTORY',
          payload: {
            messages: existing.map((row) => ({
              id: row.id,
              message: row.text || row.message,
              userId: row.userId,
              userName: row.userName || row.user?.userName,
              avatarUrl: row.avatarUrl || row.user?.profilePic,
              timestamp: row.createdAt,
            })),
          },
        })
      }
      const url = live.signalingUrl(session.value)
      if (!url) throw new Error('Missing livestream token')
      off = socket.onMessage(handle)
      socket.connect(url)
    } finally {
      joining.value = false
    }
  }

  function react(kind = 'LIKE') {
    socket.send('REACTION', { kind })
  }

  async function leaveLive() {
    if (stream.value?.id) {
      try {
        await live.leave(stream.value.id)
      } catch {
        // ignore
      }
    }
    socket.disconnect()
    webrtc.teardown()
  }

  onBeforeUnmount(() => {
    if (joinRetry) clearTimeout(joinRetry)
    off?.()
  })

  return {
    stream,
    session,
    viewerCount,
    likeCount,
    liveStatus,
    ended,
    joining,
    socket,
    webrtc,
    chat,
    watch,
    react,
    leaveLive,
  }
}
