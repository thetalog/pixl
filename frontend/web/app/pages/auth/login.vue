<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 p-4">
    <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow">
      <h1 class="text-xl font-semibold text-gray-900">Login</h1>

      <form class="mt-4 space-y-4" @submit.prevent="onSubmit">
        <label class="block">
          <span class="block text-sm font-medium text-gray-700">Email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="you@example.com"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
          />
        </label>

        <label class="block">
          <span class="block text-sm font-medium text-gray-700">Password</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
          />
        </label>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {{ loading ? 'Logging in…' : 'Login' }}
        </button>

        <p v-if="error" class="text-sm text-red-600">
          {{ error }}
        </p>

        <NuxtLink to="/auth/signup" class="block text-center text-sm text-gray-900 underline">
          Create account
        </NuxtLink>
      </form>
    </div>
  </div>
</template>

<script setup lang="js">
const { login, isLoggedIn } = useAuth()  // destructure properly
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const jwtTokenCookie = useCookie('jwt_token', { sameSite: 'lax', path: '/' })
const profileUsernameCookie = useCookie('profile_username', { sameSite: 'lax', path: '/' })

if (jwtTokenCookie.value || isLoggedIn.value) await navigateTo('/')

const onSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    const res = await login({
      email: email.value.trim(),
      password: password.value
    })

    const userName = res?.userName || res?.data?.userName || res?.data?.data?.userName
    if (typeof userName === 'string' && userName.trim()) {
      profileUsernameCookie.value = userName.trim()
    }

    const token =
      res?.data?.data ||
      res?.data?.token ||
      res?.token ||
      res?.jwt ||
      res?.accessToken ||
      res?.data

    if (typeof token === 'string' && token.length > 0) {
      jwtTokenCookie.value = token
    }

    await navigateTo('/')
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>