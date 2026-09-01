<template>
  <div
    v-if="impersonating"
    class="sticky top-0 z-[70] flex items-center justify-between gap-3 bg-pixl-danger px-4 py-2 text-sm text-white"
  >
    <span>You are viewing Pixl as another user. Destructive staff actions are blocked.</span>
    <UiButton size="sm" variant="secondary" :loading="stopping" @click="stop">
      Return to my account
    </UiButton>
  </div>
</template>

<script setup>
const { user } = useAuth()
const admin = useAdmin()
const toast = useToast()
const stopping = ref(false)

const impersonating = computed(() => Boolean(user.value?.impersonating || admin.me.value?.impersonating))

async function stop() {
  stopping.value = true
  try {
    const data = await admin.post('/admin/impersonation/stop', {})
    await admin.persistToken(data)
    toast.success('Returned to your account')
    await navigateTo('/admin')
  } catch (error) {
    toast.error(error?.data?.message || 'Could not end impersonation')
  } finally {
    stopping.value = false
  }
}
</script>
