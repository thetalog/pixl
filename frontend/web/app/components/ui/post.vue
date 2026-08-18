<template>
  <article class="overflow-hidden rounded-card bg-pixl-card ring-1 ring-white/6">
    <div class="flex items-center gap-3 px-3 py-3">
      <UiAvatar
        :src="authorProfilePic"
        :alt="authorUserName"
        :size="32"
        :to="authorUserName ? `/profile/${authorUserName}` : ''"
      />
      <NuxtLink
        v-if="authorUserName"
        :to="`/profile/${authorUserName}`"
        class="min-w-0 flex-1 truncate text-sm font-semibold hover:text-pixl-accent-2"
      >
        {{ authorUserName }}
      </NuxtLink>
      <span v-else class="min-w-0 flex-1 truncate text-sm font-semibold">Unknown</span>
      <span v-if="post.createdAt" class="text-xs text-pixl-tertiary">{{ formatRelative(post.createdAt) }}</span>
      <button
        v-if="isOwn"
        type="button"
        class="inline-flex h-8 w-8 items-center justify-center rounded-full text-pixl-muted hover:bg-white/6 hover:text-pixl-text"
        aria-label="Post options"
        @click="menuOpen = true"
      >
        <UiIcon name="more" :size="18" />
      </button>
    </div>

    <div v-if="mediaItems.length" class="relative bg-black">
      <div class="aspect-square w-full overflow-hidden">
        <template v-for="(m, i) in mediaItems" :key="m.id || i">
          <div v-show="i === mediaIndex" class="h-full w-full">
            <video
              v-if="playVideo && isVideoMedia(m) && mediaUrl(m)"
              :src="mediaUrl(m)"
              class="h-full w-full object-cover"
              controls
              playsinline
              preload="metadata"
            />
            <img
              v-else-if="previewUrl(m)"
              :src="previewUrl(m)"
              :alt="caption || 'Post media'"
              class="h-full w-full object-cover"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="($event) => { $event.target.style.display = 'none' }"
            />
            <div v-else class="grid h-full w-full place-items-center bg-pixl-elevated text-pixl-muted">
              <UiIcon name="image" :size="28" />
            </div>
          </div>
        </template>
      </div>

      <button
        v-if="mediaItems.length > 1 && mediaIndex > 0"
        type="button"
        class="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white"
        aria-label="Previous media"
        @click="mediaIndex -= 1"
      >
        <UiIcon name="back" :size="16" />
      </button>
      <button
        v-if="mediaItems.length > 1 && mediaIndex < mediaItems.length - 1"
        type="button"
        class="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white"
        aria-label="Next media"
        @click="mediaIndex += 1"
      >
        <UiIcon name="back" class="rotate-180" :size="16" />
      </button>

      <div v-if="mediaItems.length > 1" class="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
        <span
          v-for="(_, i) in mediaItems"
          :key="i"
          class="h-1.5 w-1.5 rounded-full"
          :class="i === mediaIndex ? 'bg-white' : 'bg-white/40'"
        />
      </div>
    </div>

    <div class="flex items-center gap-1 px-2 py-1.5">
      <button
        type="button"
        class="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/6"
        aria-label="Like"
        :disabled="likePending"
        @click="toggleLike"
      >
        <UiIcon
          name="heart"
          :size="22"
          :filled="displayIsLiked"
          :class="displayIsLiked ? 'text-pixl-danger heart-pop' : 'text-pixl-text'"
        />
      </button>
      <button
        type="button"
        class="inline-flex h-10 items-center gap-1 rounded-full px-2 hover:bg-white/6"
        aria-label="Comments"
        @click="toggleComments"
      >
        <UiIcon name="comment" :size="22" />
        <span class="text-sm font-medium">{{ displayCommentCount }}</span>
      </button>
      <button
        type="button"
        class="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/6"
        aria-label="Share"
        @click="sharePost"
      >
        <UiIcon name="send" :size="20" />
      </button>
      <div class="flex-1" />
      <button
        type="button"
        class="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/6"
        aria-label="Save"
        :disabled="savePending"
        @click="toggleSave"
      >
        <UiIcon name="bookmark" :size="20" :filled="displayIsSaved" :class="displayIsSaved ? 'text-pixl-accent' : ''" />
      </button>
    </div>

    <div class="px-3 pb-3">
      <p v-if="caption" class="text-sm leading-relaxed text-pixl-text">
        <span class="font-semibold">{{ authorUserName }}</span>
        {{ caption }}
      </p>
      <div v-if="tags.length" class="mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
        <span v-for="t in tags" :key="t" class="text-xs font-semibold text-pixl-accent-2">#{{ t }}</span>
      </div>
      <p v-if="post.location" class="mt-1 text-xs text-pixl-tertiary">{{ post.location }}</p>
    </div>

    <div v-if="showComments" class="border-t border-white/6 px-3 py-3">
      <div class="max-h-56 space-y-3 overflow-y-auto">
        <div v-if="commentsLoading" class="space-y-2">
          <UiSkeleton v-for="n in 3" :key="n" height="28px" />
        </div>
        <p v-else-if="commentsError" class="text-sm text-pixl-danger">{{ commentsError }}</p>
        <p v-else-if="commentsList.length === 0" class="text-sm text-pixl-muted">No comments yet.</p>
        <div v-else v-for="c in commentsList" :key="c?.id || c?.createdAt || JSON.stringify(c)" class="flex items-start gap-2">
          <UiAvatar :src="c?.user?.profilePic" :size="32" />
          <div class="min-w-0 flex-1">
            <p class="break-words text-sm">{{ c?.text || c?.commentText || '' }}</p>
          </div>
        </div>
      </div>

      <form class="mt-3 flex items-center gap-2" @submit.prevent="submitComment">
        <input
          ref="commentInputEl"
          v-model="commentDraft"
          type="text"
          placeholder="Add a comment"
          class="h-10 w-full rounded-control border border-white/8 bg-pixl-elevated px-3 text-sm text-pixl-text placeholder:text-pixl-tertiary focus:border-pixl-accent/60 focus:ring-2 focus:ring-pixl-accent/40"
          :disabled="commentPending"
        />
        <UiButton type="submit" size="sm" :disabled="commentPending || !commentDraft.trim()" :loading="commentPending">
          Post
        </UiButton>
      </form>
    </div>

    <UiModal :open="menuOpen" title="Post options" @close="menuOpen = false">
      <div class="space-y-2">
        <UiTextField v-model="editCaption" label="Caption" multiline />
        <UiButton block :loading="savingCaption" @click="saveCaption">Save caption</UiButton>
        <label class="block text-sm text-pixl-muted">
          Category
          <select
            v-model="editCategory"
            class="mt-1 h-10 w-full rounded-control border border-white/8 bg-pixl-elevated px-3 text-pixl-text"
            @change="saveCategory"
          >
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
      </div>
    </UiModal>
  </article>
</template>

<script setup>
const emit = defineEmits(['liked-change', 'saved-change', 'comment-posted'])

const props = defineProps({
  post: { type: Object, required: true },
  playVideo: { type: Boolean, default: false },
})

const api = usePixlApi()
const toast = useToast()
const { myUsername, isLoggedIn } = useAuth()

const authorUserName = computed(() => props.post?.user?.userName || props.post?.userName || '')
const authorProfilePic = computed(() => props.post?.user?.profilePic || props.post?.profilePic || '')
const caption = computed(() => props.post?.caption?.toString?.() || props.post?.caption || '')
const isOwn = computed(() => !!myUsername.value && myUsername.value === authorUserName.value)

const mediaItems = computed(() => (Array.isArray(props.post?.media) ? props.post.media : []))
const mediaIndex = ref(0)

function mediaUrl(m) {
  return normalizeUrl(m?.url)
}

const commentCount = computed(() => {
  const comments = props.post?.comments
  return Array.isArray(comments) ? comments.length : 0
})

const isLiked = computed(() => {
  const reactions = props.post?.reactions
  if (typeof props.post?.isLiked === 'boolean') return props.post.isLiked
  return Array.isArray(reactions) && reactions.length > 0
})

const isSaved = computed(() => {
  const savedBy = props.post?.savedBy
  if (typeof props.post?.isSaved === 'boolean') return props.post.isSaved
  return Array.isArray(savedBy) && savedBy.length > 0
})

const postId = computed(() => props.post?.id?.toString?.() || props.post?.id || '')

const likePending = ref(false)
const savePending = ref(false)
const commentPending = ref(false)
const likeOverride = ref(null)
const saveOverride = ref(null)
const showComments = ref(false)
const commentDraft = ref('')
const commentInputEl = ref(null)
const comments = ref([])
const commentsLoading = ref(false)
const commentsError = ref('')
const commentsLoadedForPostId = ref('')
const menuOpen = ref(false)
const editCaption = ref('')
const editCategory = ref(props.post?.uiCategory || 'UNSET')
const savingCaption = ref(false)
const categories = ['IGTV', 'SHOP', 'STYLE', 'SPORTS', 'AUTO', 'MUSIC', 'MOVIES', 'UNSET']

watch(
  () => props.post,
  () => {
    likeOverride.value = null
    saveOverride.value = null
    showComments.value = false
    commentDraft.value = ''
    comments.value = []
    commentsLoading.value = false
    commentsError.value = ''
    commentsLoadedForPostId.value = ''
    mediaIndex.value = 0
    editCaption.value = caption.value
    editCategory.value = props.post?.uiCategory || 'UNSET'
  },
  { immediate: true }
)

const displayIsLiked = computed(() => (likeOverride.value ?? isLiked.value) === true)
const displayIsSaved = computed(() => (saveOverride.value ?? isSaved.value) === true)
const commentsList = computed(() => {
  if (commentsLoadedForPostId.value === postId.value) return comments.value
  const inline = props.post?.comments
  return Array.isArray(inline) ? inline : []
})
const displayCommentCount = computed(() => {
  if (commentsLoadedForPostId.value === postId.value) return comments.value.length
  return commentCount.value
})

function ensureAuthed() {
  if (isLoggedIn.value) return true
  navigateTo('/auth/login')
  return false
}

async function toggleLike() {
  if (!postId.value || likePending.value) return
  if (!ensureAuthed()) return
  const current = displayIsLiked.value
  likeOverride.value = !current
  likePending.value = true
  try {
    const res = await api.request(`/posts/like-or-unlike/${encodeURIComponent(postId.value)}`, { method: 'PATCH' })
    const message = res?.message?.toString?.() || ''
    if (message === 'Liked') likeOverride.value = true
    else if (message === 'Unliked') likeOverride.value = false
    emit('liked-change', likeOverride.value)
  } catch (e) {
    likeOverride.value = current
    toast.error(apiErrorMessage(e, 'Could not like'))
  } finally {
    likePending.value = false
  }
}

async function toggleSave() {
  if (!postId.value || savePending.value) return
  if (!ensureAuthed()) return
  const current = displayIsSaved.value
  saveOverride.value = !current
  savePending.value = true
  try {
    const res = await api.request(`/posts/save-or-unsave/${encodeURIComponent(postId.value)}`, { method: 'PATCH' })
    const message = res?.message?.toString?.() || ''
    if (message === 'Saved') saveOverride.value = true
    else if (message === 'Unsaved') saveOverride.value = false
    emit('saved-change', { id: postId.value, saved: saveOverride.value })
  } catch (e) {
    saveOverride.value = current
    toast.error(apiErrorMessage(e, 'Could not save'))
  } finally {
    savePending.value = false
  }
}

async function sharePost() {
  if (!postId.value) return
  try {
    const res = await api.request('/posts/generate-post-share-link', { query: { postId: postId.value } })
    const link = typeof res?.data === 'string' ? res.data : ''
    if (link && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(link)
      toast.success('Link copied')
    } else {
      toast.error('Could not copy link')
    }
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Share failed'))
  }
}

async function loadCommentsIfNeeded() {
  if (!postId.value) return
  if (commentsLoadedForPostId.value === postId.value) return
  if (!ensureAuthed()) return
  commentsLoading.value = true
  commentsError.value = ''
  try {
    const res = await api.request('/posts/comments', {
      method: 'GET',
      query: { postId: postId.value, skip: '0', take: '200' },
    })
    comments.value = Array.isArray(res?.data) ? res.data : []
    commentsLoadedForPostId.value = postId.value
  } catch (e) {
    commentsError.value = apiErrorMessage(e, 'Failed to load comments')
    comments.value = []
    commentsLoadedForPostId.value = postId.value
  } finally {
    commentsLoading.value = false
  }
}

async function toggleComments() {
  if (!postId.value) return
  const next = !showComments.value
  showComments.value = next
  if (next) {
    await loadCommentsIfNeeded()
    await nextTick()
    commentInputEl.value?.focus?.()
  }
}

async function submitComment() {
  if (!postId.value || commentPending.value) return
  if (!ensureAuthed()) return
  const commentText = commentDraft.value.trim()
  if (!commentText) return
  commentPending.value = true
  commentsError.value = ''
  const optimistic = {
    id: `local-${Date.now()}`,
    text: commentText,
    createdAt: new Date().toISOString(),
    user: {},
  }
  if (commentsLoadedForPostId.value !== postId.value) {
    comments.value = [...commentsList.value]
    commentsLoadedForPostId.value = postId.value
  }
  comments.value = [optimistic, ...comments.value]
  try {
    await api.request(`/posts/${encodeURIComponent(postId.value)}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { commentText },
    })
    commentDraft.value = ''
    emit('comment-posted', commentText)
  } catch (e) {
    comments.value = comments.value.filter((c) => c?.id !== optimistic.id)
    commentsError.value = apiErrorMessage(e, 'Failed to post')
    toast.error(commentsError.value)
  } finally {
    commentPending.value = false
  }
}

async function saveCaption() {
  if (!postId.value || savingCaption.value) return
  savingCaption.value = true
  try {
    await api.request('/posts/edit-caption', {
      method: 'PATCH',
      body: { postId: postId.value, newCaption: editCaption.value },
    })
    props.post.caption = editCaption.value
    menuOpen.value = false
    toast.success('Caption updated')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not update caption'))
  } finally {
    savingCaption.value = false
  }
}

async function saveCategory() {
  if (!postId.value || !editCategory.value) return
  try {
    await api.request(
      `/posts/${encodeURIComponent(postId.value)}/update-ui-category/${encodeURIComponent(editCategory.value)}`,
      { method: 'POST' }
    )
    toast.success('Category updated')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Could not update category'))
  }
}

function normalizeTags(rawTags) {
  if (!rawTags) return []
  let list = []
  if (Array.isArray(rawTags)) list = rawTags
  else if (typeof rawTags === 'string') {
    list = rawTags.split(',').map((e) => e.trim()).filter(Boolean)
  } else return []
  const out = []
  for (const item of list) {
    const tag = (item ?? '').toString().trim()
    if (!tag) continue
    const normalized = tag.startsWith('#') ? tag.slice(1).trim() : tag
    if (normalized) out.push(normalized)
  }
  const seen = new Set()
  return out.filter((t) => {
    const key = t.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function hashtagsFromCaption(text) {
  if (!text) return []
  const matches = [...text.matchAll(/(^|\s)#([A-Za-z0-9_]+)/g)].map((m) => m?.[2] || '')
  return normalizeTags(matches)
}

const tags = computed(() => {
  const fromFields = normalizeTags(props.post?.userTags ?? props.post?.tags)
  if (fromFields.length) return fromFields
  return hashtagsFromCaption(caption.value)
})
</script>
