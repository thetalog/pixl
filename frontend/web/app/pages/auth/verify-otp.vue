<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-sm rounded-card bg-pixl-card/80 p-6 shadow-pixl ring-1 ring-white/6 backdrop-blur-xl">
      <h1 class="text-2xl font-semibold tracking-tight">Verify email</h1>
      <p class="mt-1 text-sm text-pixl-muted">Enter the code sent to {{ email }}.</p>

      <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <UiTextField v-model="email" label="Email" type="email" autocomplete="email" required />
        <UiTextField v-model="otp" label="OTP" inputmode="numeric" placeholder="123456" required />
        <UiButton type="submit" block :loading="loading">Verify</UiButton>
        <p v-if="error" class="text-sm text-pixl-danger">{{ error }}</p>
        <p v-if="message" class="text-sm text-pixl-success">{{ message }}</p>
      </form>

      <NuxtLink to="/auth/login" class="mt-6 block text-center text-sm text-pixl-accent">Back to login</NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', middleware: 'guest' })

const route = useRoute()
const { verifyOtp } = useAuth()
const email = ref(String(route.query.email || ''))
const otp = ref('')
const loading = ref(false)
const error = ref('')
const message = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const res = await verifyOtp({ email: email.value.trim(), otp: otp.value })
    message.value = res?.message || 'Verified. You can sign in now.'
    setTimeout(() => navigateTo('/auth/login'), 800)
  } catch (e) {
    error.value = apiErrorMessage(e, 'Verification failed')
  } finally {
    loading.value = false
  }
}
</script>
