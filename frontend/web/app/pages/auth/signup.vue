<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-md rounded-card bg-pixl-card/80 p-6 shadow-pixl ring-1 ring-white/6 backdrop-blur-xl">
      <div class="mb-6 flex items-center gap-2">
        <img src="/logo.png" alt="" width="36" height="36" class="h-9 w-9 rounded-xl" />
        <span class="text-xl font-semibold">Pixl</span>
      </div>

      <div class="mb-6 flex gap-2 text-xs font-medium text-pixl-tertiary">
        <span :class="step >= 1 ? 'text-pixl-text' : ''">Details</span>
        <span>/</span>
        <span :class="step >= 2 ? 'text-pixl-text' : ''">Username</span>
        <span>/</span>
        <span :class="step >= 3 ? 'text-pixl-text' : ''">Verify</span>
      </div>

      <h1 class="text-2xl font-semibold tracking-tight">{{ heading }}</h1>
      <p class="mt-1 text-sm text-pixl-muted">{{ subheading }}</p>

      <form v-if="step === 1" class="mt-6 space-y-4" @submit.prevent="nextFromDetails">
        <UiTextField v-model="name" label="Name" autocomplete="name" placeholder="Your name" required />
        <UiTextField v-model="email" label="Email" type="email" autocomplete="email" placeholder="you@example.com" required />
        <UiTextField v-model="dateOfBirth" label="Date of birth" type="date" required />
        <UiTextField v-model="password" label="Password" type="password" autocomplete="new-password" placeholder="••••••••" required />
        <UiButton type="submit" block>Continue</UiButton>
      </form>

      <form v-else-if="step === 2" class="mt-6 space-y-4" @submit.prevent="createAccount">
        <UiTextField
          v-model="userName"
          label="Username"
          autocomplete="username"
          placeholder="yourhandle"
          :hint="usernameHint"
          :hint-danger="usernameTaken"
        />
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="step = 1">Back</UiButton>
          <UiButton type="submit" block :loading="loading" :disabled="!usernameValid || loading">
            Create account
          </UiButton>
        </div>
      </form>

      <form v-else class="mt-6 space-y-4" @submit.prevent="confirmOtp">
        <p class="text-sm text-pixl-muted">We sent a code to {{ email }}.</p>
        <UiTextField v-model="otp" label="OTP" inputmode="numeric" placeholder="123456" required />
        <div class="flex gap-2">
          <UiButton variant="secondary" :disabled="otpSending" @click="resendOtp">
            {{ otpSending ? 'Sending…' : 'Resend' }}
          </UiButton>
          <UiButton type="submit" block :loading="loading" :disabled="loading">Verify</UiButton>
        </div>
      </form>

      <p v-if="error" class="mt-4 text-sm text-pixl-danger">{{ error }}</p>
      <p v-if="message" class="mt-4 text-sm text-pixl-success">{{ message }}</p>

      <p class="mt-6 text-center text-sm text-pixl-muted">
        Already have an account?
        <NuxtLink to="/auth/login" class="font-semibold text-pixl-accent hover:text-pixl-accent-2">Sign in</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', middleware: 'guest' })

const { signup, sendOtp, verifyOtp, login, checkUsername } = useAuth()

const step = ref(1)
const name = ref('')
const email = ref('')
const dateOfBirth = ref('')
const password = ref('')
const userName = ref('')
const otp = ref('')
const loading = ref(false)
const otpSending = ref(false)
const error = ref('')
const message = ref('')
const usernameTaken = ref(false)
const usernameChecked = ref(false)

const heading = computed(() => {
  if (step.value === 1) return 'Create account'
  if (step.value === 2) return 'Pick a username'
  return 'Verify your email'
})
const subheading = computed(() => {
  if (step.value === 1) return 'A few details to get started.'
  if (step.value === 2) return '3–30 characters. This is how people find you.'
  return 'Enter the one-time code we emailed you.'
})

const usernameValid = computed(() => {
  const v = userName.value.trim()
  return v.length >= 3 && v.length <= 30 && /^[A-Za-z0-9._]+$/.test(v)
})

const usernameHint = computed(() => {
  if (!userName.value.trim()) return 'Letters, numbers, dots, and underscores.'
  if (!usernameValid.value) return 'Use 3–30 letters, numbers, dots, or underscores.'
  if (usernameTaken.value) return 'That username is taken.'
  if (usernameChecked.value) return 'Looks available.'
  return ''
})

let userTimer = null
watch(userName, (val) => {
  usernameTaken.value = false
  usernameChecked.value = false
  if (userTimer) clearTimeout(userTimer)
  const v = val.trim()
  if (!usernameValid.value) return
  userTimer = setTimeout(async () => {
    try {
      const res = await checkUsername(v)
      usernameTaken.value = !!res?.exists
      usernameChecked.value = true
    } catch {
      usernameChecked.value = false
    }
  }, 320)
})

function nextFromDetails() {
  error.value = ''
  if (name.value.trim().length < 3) {
    error.value = 'Name must be 3–30 characters.'
    return
  }
  step.value = 2
}

async function createAccount() {
  error.value = ''
  message.value = ''
  if (!usernameValid.value) return
  loading.value = true
  try {
    await signup({
      name: name.value.trim(),
      userName: userName.value.trim(),
      email: email.value.trim(),
      password: password.value,
      dateOfBirth: dateOfBirth.value,
    })
  } catch (e) {
    error.value = apiErrorMessage(e, 'Signup failed')
    loading.value = false
    return
  }

  try {
    await sendOtp({ name: name.value.trim(), email: email.value.trim() })
    message.value = 'Account created. Check your email for a code.'
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not send OTP. You can resend on the next step.')
  } finally {
    step.value = 3
    loading.value = false
  }
}

async function resendOtp() {
  otpSending.value = true
  error.value = ''
  message.value = ''
  try {
    await sendOtp({ name: name.value.trim(), email: email.value.trim() })
    message.value = 'OTP sent.'
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not send OTP')
  } finally {
    otpSending.value = false
  }
}

async function confirmOtp() {
  error.value = ''
  message.value = ''
  loading.value = true
  try {
    await verifyOtp({ email: email.value.trim(), otp: otp.value })
    try {
      await login({ email: email.value.trim(), password: password.value })
      await navigateTo('/')
    } catch {
      await navigateTo('/auth/login')
    }
  } catch (e) {
    error.value = apiErrorMessage(e, 'Verification failed')
  } finally {
    loading.value = false
  }
}
</script>
