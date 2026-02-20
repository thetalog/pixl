<template>
	<article class="bg-white">
		<!-- Header -->
		<div class="flex items-center gap-2.5 px-3 py-2.5">
			<div class="h-7 w-7 overflow-hidden rounded-full bg-gray-200">
				<img
					v-if="authorProfilePic"
					:src="authorProfilePic"
					:alt="authorUserName || 'User'"
					class="h-full w-full object-cover"
					loading="lazy"
					referrerpolicy="no-referrer"
				/>
				<div v-else class="flex h-full w-full items-center justify-center text-gray-700">
					<svg viewBox="0 0 24 24" class="h-4 w-4" aria-hidden="true">
						<path
							fill="currentColor"
							d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
						/>
					</svg>
				</div>
			</div>

			<div class="min-w-0 flex-1">
				<div class="truncate font-semibold text-gray-900">
					{{ authorUserName || 'Unknown' }}
				</div>
			</div>
		</div>

		<!-- Media -->
		<div v-if="mediaUrl" class="aspect-square w-full bg-gray-100">
			<img
				:src="mediaUrl"
				:alt="caption || 'Post media'"
				class="h-full w-full object-cover"
				loading="lazy"
				referrerpolicy="no-referrer"
			/>
		</div>

		<!-- Actions -->
		<div class="flex h-10 w-full items-center gap-3.5 bg-gray-50 px-2">
			<button
				type="button"
				class="inline-flex items-center"
				aria-label="Like"
				:disabled="likePending"
				@click="toggleLike"
			>
				<svg
					v-if="displayIsLiked"
					viewBox="0 0 24 24"
					class="h-5 w-5 text-gray-900"
					aria-hidden="true"
				>
					<path
						fill="currentColor"
						d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
					/>
				</svg>
				<svg
					v-else
					viewBox="0 0 24 24"
					class="h-5 w-5 text-gray-900"
					aria-hidden="true"
				>
					<path
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						d="M12.1 8.64l-.1.1-.11-.11C10.14 6.9 7.4 7.06 5.71 8.76c-1.69 1.7-1.6 4.46.2 6.27L12 21l6.09-5.97c1.8-1.81 1.89-4.57.2-6.27-1.69-1.7-4.43-1.86-6.19-.12Z"
					/>
				</svg>
			</button>

			<button
				type="button"
				class="inline-flex items-center gap-1"
				aria-label="Comments"
				@click="toggleComments"
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5 text-gray-900" aria-hidden="true">
					<path
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"
					/>
				</svg>
				<span class="text-sm font-medium text-gray-900">{{ displayCommentCount }}</span>
			</button>

			<button type="button" class="inline-flex items-center" aria-label="Send">
				<svg viewBox="0 0 24 24" class="h-5 w-5 text-gray-900" aria-hidden="true">
					<path
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						d="M22 2 11 13"
					/>
					<path
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						d="M22 2 15 22l-4-9-9-4Z"
					/>
				</svg>
			</button>

			<div class="flex-1" />

			<button
				type="button"
				class="inline-flex items-center"
				aria-label="Save"
				:disabled="savePending"
				@click="toggleSave"
			>
				<svg
					v-if="displayIsSaved"
					viewBox="0 0 24 24"
					class="h-[22px] w-[22px] text-gray-900"
					aria-hidden="true"
				>
					<path
						fill="currentColor"
						d="M6 2h12a2 2 0 0 1 2 2v20l-8-4-8 4V4a2 2 0 0 1 2-2Z"
					/>
				</svg>
				<svg
					v-else
					viewBox="0 0 24 24"
					class="h-[22px] w-[22px] text-gray-900"
					aria-hidden="true"
				>
					<path
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						d="M6 3h12a1 1 0 0 1 1 1v18l-7-3.5L5 22V4a1 1 0 0 1 1-1Z"
					/>
				</svg>
			</button>
		</div>

		<!-- Caption -->
		<div class="border-b border-gray-200">
			<p class="px-3 py-2 text-sm text-gray-900">
				{{ caption }}
			</p>

			<div v-if="tags.length" class="px-3 pb-2">
				<div class="flex flex-wrap gap-x-2.5 gap-y-1.5">
					<span
						v-for="t in tags"
						:key="t"
						class="text-xs font-semibold text-gray-900"
					>
						#{{ t }}
					</span>
				</div>
			</div>
		</div>

		<!-- Comments "popup" -->
		<div v-if="showComments" class="border-b border-gray-200 bg-gray-50 px-3 py-3">
			<div class="max-h-56 space-y-3 overflow-y-auto">
				<div v-if="commentsLoading" class="text-sm text-gray-700">Loading comments…</div>
				<div v-else-if="commentsError" class="text-sm text-gray-700">Failed to load comments.</div>
				<div v-else-if="commentsList.length === 0" class="text-sm text-gray-700">No comments yet.</div>
				<div v-else v-for="c in commentsList" :key="c?.id || c?.createdAt || JSON.stringify(c)" class="flex items-start gap-2">
					<div class="mt-0.5 h-6 w-6 overflow-hidden rounded-full bg-gray-200">
						<img
							v-if="c?.user?.profilePic"
							:src="c.user.profilePic"
							alt=""
							class="h-full w-full object-cover"
							loading="lazy"
							referrerpolicy="no-referrer"
						/>
					</div>
					<div class="min-w-0 flex-1">
						<div class="break-words text-sm text-gray-900">{{ c?.text || c?.commentText || '' }}</div>
					</div>
				</div>
			</div>

			<form class="mt-3 flex items-center gap-2" @submit.prevent="submitComment">
				<input
					ref="commentInputEl"
					v-model="commentDraft"
					type="text"
					placeholder="Add a comment"
					class="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900"
					:disabled="commentPending"
				/>
				<button
					type="submit"
					:disabled="commentPending || !commentDraft.trim()"
					class="h-9 shrink-0 rounded-md bg-gray-900 px-3 text-sm font-semibold text-white disabled:opacity-60"
				>
					{{ commentPending ? 'Posting…' : 'Post' }}
				</button>
			</form>
		</div>
	</article>
</template>

<script setup lang="js">
const emit = defineEmits(['liked-change', 'saved-change', 'comment-posted'])

const props = defineProps({
	post: {
		type: Object,
		required: true,
	},
})

const api = usePixlApi()
const jwtTokenCookie = useCookie('jwt_token', { sameSite: 'lax', path: '/' })

const authorUserName = computed(() => props.post?.user?.userName || props.post?.userName || '')
const authorProfilePic = computed(() => props.post?.user?.profilePic || props.post?.profilePic || '')

const caption = computed(() => props.post?.caption?.toString?.() || props.post?.caption || '')

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
	}
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
	if (jwtTokenCookie.value) return true
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
		const res = await api.request(`/posts/like-or-unlike/${encodeURIComponent(postId.value)}`, {
			method: 'PATCH',
		})
		const message = res?.message?.toString?.() || ''
		if (message === 'Liked') likeOverride.value = true
		else if (message === 'Unliked') likeOverride.value = false
		emit('liked-change', likeOverride.value)
	} catch (e) {
		likeOverride.value = current
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
		const res = await api.request(`/posts/save-or-unsave/${encodeURIComponent(postId.value)}`, {
			method: 'PATCH',
		})
		const message = res?.message?.toString?.() || ''
		if (message === 'Saved') saveOverride.value = true
		else if (message === 'Unsaved') saveOverride.value = false
		emit('saved-change', saveOverride.value)
	} catch (e) {
		saveOverride.value = current
	} finally {
		savePending.value = false
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
			query: {
				postId: postId.value,
				skip: '0',
				take: '200',
			},
		})
		const list = res?.data
		comments.value = Array.isArray(list) ? list : []
		commentsLoadedForPostId.value = postId.value
	} catch (e) {
		commentsError.value = e?.data?.message || e?.message || 'Failed'
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

	// Ensure we have a list to show and prepend.
	if (commentsLoadedForPostId.value !== postId.value) {
		comments.value = [...commentsList.value]
		commentsLoadedForPostId.value = postId.value
	}
	comments.value = [optimistic, ...comments.value]

	try {
		await api.request(`/posts/${encodeURIComponent(postId.value)}/comment`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				commentText,
			},
		})

		commentDraft.value = ''
		emit('comment-posted', commentText)
	} catch (e) {
		// Revert optimistic insert
		comments.value = comments.value.filter((c) => c?.id !== optimistic.id)
		commentsError.value = e?.data?.message || e?.message || 'Failed to post'
	} finally {
		commentPending.value = false
	}
}

const mediaUrl = computed(() => {
	const media = props.post?.media
	if (!Array.isArray(media) || media.length === 0) return ''
	const first = media[0] || {}
	const mimeType = (first.mimeType || '').toString()
	const rawUrl = mimeType === 'VIDEO' ? first.thumbnail : first.url
	return rawUrl?.toString?.() || rawUrl || ''
})

function normalizeTags(rawTags) {
	if (!rawTags) return []

	let list = []
	if (Array.isArray(rawTags)) {
		list = rawTags
	} else if (typeof rawTags === 'string') {
		list = rawTags
			.split(',')
			.map((e) => e.trim())
			.filter(Boolean)
	} else {
		return []
	}

	const out = []
	for (const item of list) {
		const tag = (item ?? '').toString().trim()
		if (!tag) continue
		const normalized = tag.startsWith('#') ? tag.slice(1).trim() : tag
		if (!normalized) continue
		out.push(normalized)
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
