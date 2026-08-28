<script setup>
definePageMeta({
  middleware: 'auth',
  hideBottomNav: true,
  hideHeader: true,
  ssr: false,
  pageTransition: false,
})

const route = useRoute()
const toast = useToast()
const { user } = useAuth()
const liveApi = useLivestream()
const liveId = computed(() => String(route.params.liveId || ''))

const host = useLivestreamHost()
const viewer = useLivestreamViewer()

const isHost = ref(false)
const ending = ref(false)

const active = computed(() => (isHost.value ? host : viewer))
const streamTitle = computed(() => active.value.stream.value?.title || 'Live')
const liveStatus = computed(() => active.value.liveStatus.value || 'CREATED')
const connection = computed(() => active.value.socket.status.value || '')
const viewerCount = computed(() => active.value.viewerCount.value || 0)
const likeCount = computed(() => active.value.likeCount.value || 0)
const comments = computed(() => active.value.chat.comments.value || [])
const sending = computed(() => active.value.chat.sending.value)
const ended = computed(() => active.value.ended.value)
const micOn = computed(() => host.webrtc.micOn.value)
const cameraOn = computed(() => host.webrtc.cameraOn.value)
const videoStream = computed(() => {
  if (isHost.value) return host.webrtc.localStream.value || null
  return viewer.webrtc.remoteStream.value || null
})

onMounted(async () => {
  try {
    const current = await liveApi.get(liveId.value)
    isHost.value = liveApi.isOwnStream(current, user.value)
    if (isHost.value) {
      await host.attachExisting(liveId.value)
    } else {
      await viewer.watch(liveId.value)
    }
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not open live'))
  }
})

onBeforeUnmount(async () => {
  if (!isHost.value) {
    await viewer.leaveLive()
  } else {
    host.socket.disconnect()
    host.webrtc.teardown()
  }
})

async function sendComment(text) {
  if (isHost.value) await host.chat.send(text)
  else await viewer.chat.send(text)
}

async function endLive() {
  ending.value = true
  try {
    await host.endLive()
    await navigateTo('/live')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not end live'))
  } finally {
    ending.value = false
  }
}

function leave() {
  navigateTo('/live')
}

function toggleMic() {
  host.webrtc.setMic(!host.webrtc.micOn.value)
}

function toggleCamera() {
  host.webrtc.setCamera(!host.webrtc.cameraOn.value)
}
</script>

<template>
  <div class="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col gap-4 px-4 py-4 lg:flex-row">
    <div class="flex min-h-[50vh] flex-1 flex-col overflow-hidden rounded-card bg-pixl-card ring-1 ring-white/6">
      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <button type="button" class="text-sm text-pixl-muted" @click="leave">Leave</button>
        <LiveStatus :status="liveStatus" :connection="connection" />
        <LiveViewerCount :count="viewerCount" />
      </div>

      <LiveEnded v-if="ended" />
      <LiveViewer v-else :stream="videoStream" :muted="isHost" :mirror="false">
        <template #badge>
          <span class="rounded-full bg-black/50 px-2 py-1 text-xs">{{ streamTitle }}</span>
        </template>
      </LiveViewer>

      <div class="flex items-center justify-between gap-3 px-4 py-3">
        <LiveControls
          v-if="isHost"
          :mic-on="micOn"
          :camera-on="cameraOn"
          :ending="ending"
          @toggle-mic="toggleMic"
          @toggle-camera="toggleCamera"
          @switch-camera="host.webrtc.switchCamera()"
          @end="endLive"
        />
        <div v-else class="flex items-center gap-3">
          <LiveReactions @react="viewer.react('LIKE')" />
          <span class="text-xs text-pixl-muted">{{ likeCount }} likes</span>
        </div>
      </div>
    </div>

    <aside class="flex h-[40vh] w-full flex-col overflow-hidden rounded-card bg-pixl-card ring-1 ring-white/6 lg:h-auto lg:w-80">
      <LiveChat :comments="comments" :sending="sending" @send="sendComment" />
    </aside>
  </div>
</template>
