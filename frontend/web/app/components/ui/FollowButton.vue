<template>
  <button
    type="button"
    class="h-9 min-w-[96px] rounded-full px-3 text-sm font-semibold transition duration-200 disabled:opacity-50"
    :class="buttonClass"
    :disabled="pending"
    :aria-label="label"
    @click="onClick"
  >
    {{ pending ? '…' : label }}
  </button>
</template>

<script setup>
const props = defineProps({
  username: { type: String, required: true },
  initialFollowed: { type: Boolean, default: false },
})

const emit = defineEmits(['change'])
const toast = useToast()
const follow = useFollow()
const pending = ref(false)
const isFollow = ref(!!props.initialFollowed)
const isRequested = ref(false)

const label = computed(() => {
  if (isFollow.value) return 'Following'
  if (isRequested.value) return 'Requested'
  return 'Follow'
})

const buttonClass = computed(() => {
  if (isFollow.value || isRequested.value) return 'bg-white/8 text-pixl-text hover:bg-white/12'
  return 'bg-pixl-accent text-white hover:bg-pixl-accent-2'
})

watch(
  () => props.initialFollowed,
  (v) => {
    isFollow.value = !!v
  }
)

onMounted(async () => {
  if (!props.username) return
  try {
    const status = await follow.getStatus(props.username)
    isFollow.value = status.isFollow
    isRequested.value = status.isRequested
  } catch {
    // keep initial
  }
})

async function onClick() {
  if (pending.value || !props.username) return
  pending.value = true
  const prevFollow = isFollow.value
  const prevRequested = isRequested.value
  try {
    if (isFollow.value) {
      isFollow.value = false
      await follow.unfollow(props.username)
    } else if (isRequested.value) {
      isRequested.value = false
      await follow.cancelRequest(props.username)
    } else {
      isRequested.value = true
      await follow.requestFollow(props.username)
    }
    emit('change', { isFollow: isFollow.value, isRequested: isRequested.value })
  } catch (e) {
    isFollow.value = prevFollow
    isRequested.value = prevRequested
    toast.error(apiErrorMessage(e, 'Follow failed'))
  } finally {
    pending.value = false
  }
}
</script>
