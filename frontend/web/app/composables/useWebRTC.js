export function useWebRTC() {
  const localStream = ref(null)
  const remoteStream = ref(null)
  const cameraOn = ref(true)
  const micOn = ref(true)
  const facingMode = ref('user')
  const connectionState = ref('new')
  const iceState = ref('new')

  let pc = null
  let onLocalCandidate = null
  let pendingRemoteIce = []

  async function getPreview({ audio = true, video = true } = {}) {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access needs a secure origin (localhost or HTTPS).')
    }
    stopLocal()
    const stream = await navigator.mediaDevices.getUserMedia({
      audio,
      video: video
        ? {
            facingMode: { ideal: facingMode.value },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : false,
    })
    localStream.value = stream
    return stream
  }

  function attachPeer(iceServers, { onCandidate, onTrack } = {}) {
    closePeer()
    onLocalCandidate = onCandidate
    pc = new RTCPeerConnection({ iceServers: iceServers || [] })
    pc.onicecandidate = (event) => {
      if (!onLocalCandidate) return
      if (event.candidate) {
        const init = event.candidate.toJSON()
        if (String(init.candidate || '').includes('.local')) return
        onLocalCandidate(init)
      } else {
        onLocalCandidate({ completed: true })
      }
    }
    pc.onconnectionstatechange = () => {
      connectionState.value = pc?.connectionState || 'new'
    }
    pc.oniceconnectionstatechange = () => {
      iceState.value = pc?.iceConnectionState || 'new'
    }
    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track])
      remoteStream.value = stream
      onTrack?.(stream)
    }
    if (localStream.value) {
      for (const track of localStream.value.getTracks()) {
        pc.addTrack(track, localStream.value)
      }
    }
    return pc
  }

  async function createOffer() {
    if (!pc) throw new Error('Peer connection is missing')
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    return offer
  }

  async function applyAnswer(sdp) {
    if (!pc) throw new Error('Peer connection is missing')
    if (pc.signalingState !== 'have-local-offer') return
    await pc.setRemoteDescription({ type: 'answer', sdp })
    await flushIce()
  }

  async function applyRemoteOffer(sdp) {
    if (!pc) throw new Error('Peer connection is missing')
    if (pc.signalingState !== 'stable') return
    await pc.setRemoteDescription({ type: 'offer', sdp })
    await flushIce()
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return answer
  }

  async function addIce(candidate) {
    if (!pc || !candidate || candidate.completed) return
    if (!candidate.candidate) return
    if (!pc.remoteDescription) {
      pendingRemoteIce.push(candidate)
      return
    }
    try {
      await pc.addIceCandidate(candidate)
    } catch {
      // ignore late candidates
    }
  }

  async function flushIce() {
    const queued = pendingRemoteIce
    pendingRemoteIce = []
    for (const candidate of queued) {
      await addIce(candidate)
    }
  }

  function setMic(enabled) {
    micOn.value = enabled
    localStream.value?.getAudioTracks().forEach((track) => {
      track.enabled = enabled
    })
  }

  function setCamera(enabled) {
    cameraOn.value = enabled
    localStream.value?.getVideoTracks().forEach((track) => {
      track.enabled = enabled
    })
  }

  async function switchCamera() {
    facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'
    const previous = localStream.value
    const next = await getPreview({
      audio: Boolean(previous?.getAudioTracks().length),
      video: true,
    })
    const videoTrack = next.getVideoTracks()[0]
    const sender = pc?.getSenders().find((item) => item.track?.kind === 'video')
    if (sender && videoTrack) {
      await sender.replaceTrack(videoTrack)
    }
    previous?.getTracks().forEach((track) => track.stop())
  }

  function stopLocal() {
    localStream.value?.getTracks().forEach((track) => track.stop())
    localStream.value = null
  }

  function closePeer() {
    pendingRemoteIce = []
    if (!pc) return
    pc.onicecandidate = null
    pc.ontrack = null
    pc.close()
    pc = null
    connectionState.value = 'closed'
  }

  function teardown() {
    closePeer()
    stopLocal()
    remoteStream.value = null
  }

  onBeforeUnmount(() => teardown())

  return {
    localStream,
    remoteStream,
    cameraOn,
    micOn,
    facingMode,
    connectionState,
    iceState,
    getPreview,
    attachPeer,
    createOffer,
    applyAnswer,
    applyRemoteOffer,
    addIce,
    setMic,
    setCamera,
    switchCamera,
    teardown,
  }
}
