<template>
  <div class="min-h-screen bg-primary flex items-center justify-center">
    <div class="w-full max-w-md px-4">
      <div class="card-base">
        <h1 class="text-3xl font-lekerli text-accent mb-6 text-center">Create Account</h1>

        <form @submit.prevent="handleSignup">
          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">Username</label>
            <input
              v-model="username"
              type="text"
              required
              class="input-base w-full"
              placeholder="Choose a username"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="input-base w-full"
              placeholder="Enter your email"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">Date of Birth</label>
            <input
              v-model="dateOfBirth"
              type="date"
              class="input-base w-full"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-semibold mb-2">Password</label>
            <input
              v-model="password"
              type="password"
              required
              class="input-base w-full"
              placeholder="Create a password"
            />
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full btn-primary disabled:opacity-50"
          >
            {{ authStore.isLoading ? 'Creating account...' : 'Sign Up' }}
          </button>
        </form>

        <p v-if="authStore.error" class="text-red-500 text-sm mt-4 text-center">
          {{ authStore.error }}
        </p>

        <div class="mt-6 text-center">
          <p class="text-gray-400">
            Already have an account?
            <NuxtLink to="/auth/login" class="text-accent hover:underline">Login</NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const dateOfBirth = ref('')

const handleSignup = async () => {
  const result = await authStore.signup({
    username: username.value,
    email: email.value,
    password: password.value,
    dateOfBirth: dateOfBirth.value
  })
  if (result.success) {
    router.push('/home')
  }
}
</script>
