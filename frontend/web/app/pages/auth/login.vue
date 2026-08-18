<template>
  <div class="relative grid min-h-screen lg:grid-cols-2">
    <div class="hidden flex-col justify-between border-r border-white/6 bg-pixl-elevated p-12 lg:flex">
      <div class="flex items-center gap-3">
        <span class="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-pixl-accent to-pixl-cyan text-lg font-bold text-white">P</span>
        <span class="text-2xl font-semibold tracking-tight">Pixl</span>
      </div>
      <div>
        <p class="max-w-sm text-4xl font-semibold tracking-tight text-pixl-text">
          Quiet luxury for the people you actually care about.
        </p>
        <p class="mt-4 max-w-sm text-pixl-muted">
          Posts, reels, stories, and messages — designed for the web, not a phone screenshot.
        </p>
      </div>
      <p class="text-sm text-pixl-tertiary">Dark-first. High contrast. Yours.</p>
    </div>

    <div class="flex items-center justify-center p-6">
      <div class="w-full max-w-sm rounded-card bg-pixl-card/80 p-6 shadow-pixl ring-1 ring-white/6 backdrop-blur-xl">
        <div class="mb-6 flex items-center gap-2 lg:hidden">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-pixl-accent to-pixl-cyan text-sm font-bold text-white">P</span>
          <span class="text-xl font-semibold">Pixl</span>
        </div>
        <h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p class="mt-1 text-sm text-pixl-muted">Sign in to continue.</p>

        <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
          <UiTextField v-model="email" label="Email" type="email" autocomplete="email" placeholder="you@example.com" required />
          <UiTextField v-model="password" label="Password" type="password" autocomplete="current-password" placeholder="••••••••" required />

          <UiButton type="submit" block :loading="loading" :disabled="loading">
            {{ loading ? 'Signing in' : 'Sign in' }}
          </UiButton>

          <p v-if="error" class="text-sm text-pixl-danger">{{ error }}</p>
        </form>

        <p class="mt-6 text-center text-sm text-pixl-muted">
          New here?
          <NuxtLink to="/auth/signup" class="font-semibold text-pixl-accent hover:text-pixl-accent-2">Create an account</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'auth', middleware: 'guest' })

const { login } = useAuth()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await login({
      email: email.value.trim(),
      password: password.value,
    })
    await navigateTo('/')
  } catch (e) {
    error.value = apiErrorMessage(e, 'Login failed')
  } finally {
    loading.value = false
  }
}
</script>
