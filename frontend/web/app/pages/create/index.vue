<script setup>
definePageMeta({ middleware: 'auth', hideBottomNav: true })

const api = usePixlApi()
const toast = useToast()

const tab = ref('post')
const files = ref([])
const previews = ref([])
const caption = ref('')
const tags = ref('')
const location = ref('')
const taggedUsers = ref([])
const musicCredit = ref('Original audio')
const submitting = ref(false)
const dragOver = ref(false)
const fileInput = ref(null)

const accept = computed(() => {
  if (tab.value === 'reel') return 'video/*'
  if (tab.value === 'story') return 'image/*,video/*'
  return 'image/*,video/*'
})

const maxFiles = computed(() => (tab.value === 'post' ? 10 : 1))

watch(tab, () => clearFiles())

function clearFiles() {
  for (const p of previews.value) URL.revokeObjectURL(p.url)
  files.value = []
  previews.value = []
}

function addFiles(list) {
  const incoming = Array.from(list || []).filter((f) => f instanceof File)
  if (!incoming.length) return
  let accepted = incoming
  if (tab.value === 'reel') {
    accepted = incoming.filter((f) => f.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(f.name))
    if (!accepted.length) {
      toast.error('Reels need a video under 60 seconds. Use Post for photos.')
      return
    }
  }
  const next = tab.value === 'post' ? [...files.value, ...accepted].slice(0, 10) : accepted.slice(0, 1)
  clearFiles()
  files.value = next
  previews.value = next.map((file) => ({
    file,
    url: URL.createObjectURL(file),
    isVideo: file.type.startsWith('video/'),
  }))
}

function onDrop(e) {
  dragOver.value = false
  addFiles(e.dataTransfer?.files)
}

function parseList(value) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function addTagged(user) {
  const name = user?.userName
  if (!name || taggedUsers.value.includes(name)) return
  taggedUsers.value = [...taggedUsers.value, name]
}

function removeTagged(name) {
  taggedUsers.value = taggedUsers.value.filter((n) => n !== name)
}

async function submit() {
  if (submitting.value) return
  if (!files.value.length) {
    toast.error('Add at least one file')
    return
  }
  submitting.value = true
  try {
    const form = new FormData()
    if (tab.value === 'post') {
      for (const f of files.value) form.append('file', f)
      form.append('caption', caption.value)
      form.append('location', location.value)
      form.append('tags', JSON.stringify(parseList(tags.value)))
      form.append('taggedUsers', JSON.stringify(taggedUsers.value))
      await api.request('/posts/create-post', { method: 'POST', body: form })
      toast.success('Post created')
      await clearNuxtData('followed-posts')
      await navigateTo('/')
    } else if (tab.value === 'reel') {
      const reelFile = files.value[0]
      if (!reelFile || !(reelFile.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(reelFile.name))) {
        toast.error('Reels need a video under 60 seconds. Use Post for photos.')
        submitting.value = false
        return
      }
      form.append('file', files.value[0])
      form.append(
        'data',
        JSON.stringify({
          musicCredit: musicCredit.value.trim() || 'Original audio',
          tags: parseList(tags.value),
          caption: caption.value.trim() || ' ',
          taggedUsers: taggedUsers.value,
        })
      )
      await api.request('/posts/create-reel', { method: 'POST', body: form })
      toast.success('Reel created')
      await navigateTo('/reels')
    } else {
      form.append('file', files.value[0])
      form.append(
        'data',
        JSON.stringify({
          taggedUsers: taggedUsers.value,
          location: location.value,
          caption: caption.value,
          tags: parseList(tags.value),
        })
      )
      await api.request('/posts/create-stories', { method: 'POST', body: form })
      toast.success('Story posted')
      await navigateTo('/')
    }
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Upload failed'))
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => clearFiles())
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-6">
    <h1 class="text-2xl font-semibold tracking-tight">Create</h1>
    <div class="mt-4 flex gap-2">
      <button
        v-for="t in ['post', 'reel', 'story']"
        :key="t"
        type="button"
        class="rounded-full px-4 py-1.5 text-sm font-semibold capitalize"
        :class="tab === t ? 'bg-pixl-accent text-white' : 'bg-white/8 text-pixl-muted'"
        @click="tab = t"
      >
        {{ t }}
      </button>
      <NuxtLink to="/live" class="ml-auto rounded-full bg-white/8 px-4 py-1.5 text-sm font-semibold text-pixl-cyan">Go live</NuxtLink>
    </div>

    <div
      class="mt-6 cursor-pointer rounded-card border border-dashed border-white/12 bg-pixl-card p-8 text-center transition duration-200"
      :class="dragOver ? 'border-pixl-accent bg-pixl-accent/10' : ''"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <input ref="fileInput" type="file" class="hidden" :accept="accept" :multiple="maxFiles > 1" @change="addFiles($event.target.files)" />
      <p class="text-sm text-pixl-muted">
        Drag and drop {{ tab === 'reel' ? 'a video under 60 seconds' : tab === 'post' ? 'up to 10 files' : 'a file' }}, or tap to browse.
      </p>
    </div>

    <div v-if="previews.length" class="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
      <div v-for="(p, i) in previews" :key="p.url" class="relative h-28 w-28 shrink-0 overflow-hidden rounded-card bg-black">
        <video v-if="p.isVideo" :src="p.url" class="h-full w-full object-cover" muted />
        <img v-else :src="p.url" alt="" class="h-full w-full object-cover" />
        <button
          type="button"
          class="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70"
          aria-label="Remove"
          @click.stop="files.splice(i, 1); URL.revokeObjectURL(p.url); previews.splice(i, 1)"
        >
          <UiIcon name="close" :size="12" />
        </button>
      </div>
    </div>

    <div class="mt-6 space-y-4">
      <UiTextField v-model="caption" label="Caption" multiline />
      <UiTextField v-if="tab === 'reel'" v-model="musicCredit" label="Music credit" />
      <UiTextField v-if="tab !== 'reel'" v-model="location" label="Location" />
      <UiTextField v-model="tags" label="Tags" placeholder="art, night, city" />
      <div>
        <p class="mb-1.5 text-sm font-medium text-pixl-muted">Tag people</p>
        <UiUserTypeahead @select="addTagged" />
        <div v-if="taggedUsers.length" class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="n in taggedUsers"
            :key="n"
            type="button"
            class="rounded-full bg-white/8 px-3 py-1 text-xs"
            @click="removeTagged(n)"
          >
            @{{ n }} ×
          </button>
        </div>
      </div>
      <UiButton block :loading="submitting" @click="submit">
        {{ tab === 'post' ? 'Share post' : tab === 'reel' ? 'Share reel' : 'Share story' }}
      </UiButton>
    </div>
  </div>
</template>
