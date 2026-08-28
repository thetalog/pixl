import { CONNECTION } from '~/utils/liveReconnect'

export function useLivestreamHost() {
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
  const starting = ref(false)

  let off = null
  let publishing = false
  let joinRetry = null
  let joinAttempts = 0

  function clearJoinRetry() {
    if (joinRetry) {
      clearTimeout(joinRetry)
      joinRetry = null
    }
  }

  function scheduleJoinRetry() {
    if (publishing || joinRetry || joinAttempts >= 8) return
    joinRetry = window.setTimeout(() => {
      joinRetry = null
      if (publishing) return
      joinAttempts += 1
      if (socket.status.value === CONNECTION.CONNECTED) {
        socket.send('JOIN_STREAM')
      }
      scheduleJoinRetry()
    }, 1500)
  }

  function handle(message) {
    chat.ingest(message)
    if (message.type === 'ANSWER' && message.payload?.sdp) {
      webrtc.applyAnswer(message.payload.sdp).catch((err) => {
        toast.error(err.message || 'WebRTC answer failed')
      })
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
    }
    if (message.type === 'STREAM_ENDED') {
      ended.value = true
      liveStatus.value = 'ENDED'
    }
    if (message.type === 'ERROR') {
      toast.error(message.payload?.message || 'Live error')
    }
    if (message.type === 'READY') {
      if (message.payload?.media === 'publisher') {
        if (publishing) return
        publishing = true
        clearJoinRetry()
        publish().catch((err) => {
          publishing = false
          toast.error(err.message || 'Could not publish')
          scheduleJoinRetry()
        })
        return
      }
      publishing = false
      joinAttempts = 0
      socket.send('JOIN_STREAM')
      scheduleJoinRetry()
    }
  }

  async function publish() {
    if (!webrtc.localStream.value) {
      await webrtc.getPreview()
    }
    const iceServers = session.value?.iceServers || []
    webrtc.attachPeer(iceServers, {
      onCandidate: (candidate) => socket.send('ICE_CANDIDATE', candidate),
    })
    const offer = await webrtc.createOffer()
    socket.send('OFFER', { sdp: offer.sdp, type: 'offer' })
  }

  async function begin({ title, visibility, recordingEnabled } = {}) {
    starting.value = true
    try {
      const created = await live.create({ title, visibility, recordingEnabled })
      stream.value = created
      session.value = created.session
      liveStatus.value = created.status || 'CREATED'
      const url = live.signalingUrl(created.session)
      if (!url) throw new Error('Missing livestream token')
      off = socket.onMessage(handle)
      socket.connect(url)
      scheduleJoinRetry()
      await webrtc.getPreview()
      return created
    } finally {
      starting.value = false
    }
  }

  async function attachExisting(liveId) {
    const current = await live.get(liveId)
    stream.value = current
    session.value = current.session
    liveStatus.value = current.status || 'CREATED'
    const url = live.signalingUrl(current.session)
    if (!url) throw new Error('Missing livestream token')
    off = socket.onMessage(handle)
    socket.connect(url)
    scheduleJoinRetry()
    await nextTick()
    await webrtc.getPreview()
  }

  async function endLive() {
    if (stream.value?.id) {
      await live.end(stream.value.id)
    }
    ended.value = true
    socket.disconnect()
    webrtc.teardown()
  }

  onBeforeUnmount(() => {
    clearJoinRetry()
    off?.()
  })

  return {
    stream,
    session,
    viewerCount,
    likeCount,
    liveStatus,
    ended,
    starting,
    socket,
    webrtc,
    chat,
    begin,
    attachExisting,
    endLive,
  }
}
