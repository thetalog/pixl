<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-sm">

      <template #header>
        <h1 class="text-xl font-semibold">Login</h1>
      </template>

      <UForm
        :state="{ email, password }"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormGroup label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="you@example.com"
          />
        </UFormGroup>

        <UFormGroup label="Password" name="password">
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
          />
        </UFormGroup>

        <UButton
          type="submit"
          block
          :loading="loading"
        >
          Login
        </UButton>

        <p v-if="error" class="text-red-500 text-sm">
          {{ error }}
        </p>

        <NuxtLink
          to="/auth/signup"
          class="block text-center text-sm text-primary"
        >
          Create account
        </NuxtLink>
      </UForm>

    </UCard>
  </div>
</template>

<script setup>
const { login, isLoggedIn } = useAuth()  // destructure properly
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

if (isLoggedIn.value) {
  await navigateTo('/home')
}

const onSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    await login({
      email: email.value.trim(),
      password: password.value
    })
    await navigateTo('/home')
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>