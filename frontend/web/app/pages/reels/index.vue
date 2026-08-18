<script setup>
definePageMeta({ middleware: 'auth', hideBottomNav: true, hideHeader: true })

const api = usePixlApi()
const toast = useToast()

const reels = ref([])
const skip = ref(0)
const take = 3
const loading = ref(false)
const done = ref(false)
const activeId = ref('')
const unmuted = ref(false)
const commentOpen = ref(false)
const commentDraft = ref('')
const comments = ref([])
const commentsLoading = ref(false)
const sendingComment = ref(false)

async function loadMore() {
  if (loading.value || done.value) return
  loading.value = true
  try {
    const res = await api.request('/posts/get-all-public-reels', {
      query: { skip: String(skip.value), take: String(take) },
    })
    const list = Array.isArray(res?.data) ? res.data : []
    if (!list.length) done.value = true
    else {
      reels.value = [...reels.value, ...list]
      skip.value += take
    }
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not load reels'))
    done.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => loadMore())

function videoSrc(reel) {
  const m = Array.isArray(reel?.media) ? reel.media[0] : null
  return normalizeUrl(m?.url)
}

async function toggleLike(reel) {
  try {
    const res = await api.request(`/posts/reel/like-or-unlike/${encodeURIComponent(reel.id)}`, { method: 'PATCH' })
    const liked = String(res?.message || '').toLowerCase().includes('un') ? false : true
    reel._liked = liked
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not like'))
  }
}

async function openComments(reel) {
  activeId.value = reel.id
  commentOpen.value = true
  commentsLoading.value = true
  try {
    const res = await api.request('/posts/reel-comments', {
      query: { reelId: reel.id, skip: '0', take: '50' },
    })
    comments.value = Array.isArray(res?.data) ? res.data : []
  } catch (e) {
    comments.value = []
    toast.error(apiErrorMessage(e, 'Could not load comments'))
  } finally {
    commentsLoading.value = false
  }
}

async function sendComment() {
  const text = commentDraft.value.trim()
  if (!text || !activeId.value) return
  sendingComment.value = true
  try {
    await api.request(`/posts/${encodeURIComponent(activeId.value)}/reel-comment`, {
      method: 'POST',
      body: { commentText: text },
    })
    comments.value = [{ id: `local-${Date.now()}`, text, user: {} }, ...comments.value]
    commentDraft.value = ''
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not comment'))
  } finally {
    sendingComment.value = false
  }
}

function onIntersect(entries) {
  for (const entry of entries) {
    const video = entry.target.querySelector('video')
    if (!video) continue
    if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
      activeId.value = entry.target.dataset.id
      video.play().catch(() => {})
      const idx = Number(entry.target.dataset.index)
      if (idx >= reels.value.length - 2) loadMore()
    } else {
      video.pause()
    }
  }
}

let observer
onMounted(() => {
  observer = new IntersectionObserver(onIntersect, { threshold: [0.6] })
})
watch(reels, async () => {
  await nextTick()
  document.querySelectorAll('[data-reel]').forEach((el) => observer?.observe(el))
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="h-[100dvh] overflow-y-scroll snap-y snap-mandatory bg-black lg:pl-0">
    <div v-if="!reels.length && loading" class="grid h-full place-items-center text-sm text-pixl-muted">Loading reels…</div>
    <UiEmptyState v-else-if="!reels.length" title="No reels yet." cta="Create one" @action="navigateTo('/create')" />

    <section
      v-for="(reel, i) in reels"
      :key="reel.id"
      data-reel
      :data-id="reel.id"
      :data-index="i"
      class="relative h-[100dvh] w-full snap-start"
    >
      <video
        :src="videoSrc(reel)"
        class="h-full w-full object-cover"
        playsinline
        loop
        :muted="!unmuted"
        @click="unmuted = !unmuted"
      />
      <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pb-8">
        <NuxtLink :to="`/profile/${reel.user?.userName || ''}`" class="pointer-events-auto text-sm font-semibold">
          @{{ reel.user?.userName }}
        </NuxtLink>
        <p class="mt-1 max-w-[80%] text-sm text-white/90">{{ reel.caption }}</p>
      </div>
      <div class="absolute bottom-28 right-4 flex flex-col items-center gap-4">
        <button type="button" class="grid h-12 w-12 place-items-center rounded-full bg-black/40" aria-label="Like" @click="toggleLike(reel)">
          <UiIcon name="heart" :size="26" :filled="!!reel._liked" :class="reel._liked ? 'text-pixl-danger' : 'text-white'" />
        </button>
        <button type="button" class="grid h-12 w-12 place-items-center rounded-full bg-black/40" aria-label="Comment" @click="openComments(reel)">
          <UiIcon name="comment" :size="24" />
        </button>
        <button type="button" class="grid h-12 w-12 place-items-center rounded-full bg-black/40" aria-label="Unmute" @click="unmuted = !unmuted">
          <span class="text-[10px] font-bold">{{ unmuted ? 'ON' : 'MUTE' }}</span>
        </button>
      </div>
    </section>

    <UiModal :open="commentOpen" title="Comments" @close="commentOpen = false">
      <div class="max-h-64 space-y-2 overflow-y-auto">
        <p v-if="commentsLoading" class="text-sm text-pixl-muted">Loading…</p>
        <p v-else-if="!comments.length" class="text-sm text-pixl-muted">No comments yet.</p>
        <p v-for="c in comments" :key="c.id" class="text-sm">{{ c.text || c.commentText }}</p>
      </div>
      <form class="mt-3 flex gap-2" @submit.prevent="sendComment">
        <input v-model="commentDraft" class="h-10 flex-1 rounded-control border border-white/8 bg-pixl-elevated px-3 text-sm" placeholder="Add a comment" />
        <UiButton type="submit" size="sm" :loading="sendingComment">Send</UiButton>
      </form>
    </UiModal>
  </div>
</template>
