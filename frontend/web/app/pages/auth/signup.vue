<template>
  <div style="padding: 16px; max-width: 420px">
    <h1>Signup</h1>

    <form @submit.prevent="onSubmit" style="display: grid; gap: 12px; margin-top: 16px">
      <label>
        Name
        <input v-model="name" type="text" autocomplete="name" required style="width: 100%" />
      </label>

      <label>
        Username
        <input v-model="userName" type="text" autocomplete="username" required style="width: 100%" />
      </label>

      <label>
        Email
        <input v-model="email" type="email" autocomplete="email" required style="width: 100%" />
      </label>

      <label>
        Date of birth
        <input v-model="dateOfBirth" type="date" required style="width: 100%" />
      </label>

      <label>
        Password
        <input v-model="password" type="password" autocomplete="new-password" required style="width: 100%" />
      </label>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Creating…' : 'Create account' }}
      </button>

      <p v-if="message" style="color: green">{{ message }}</p>
      <p v-if="error" style="color: red">{{ error }}</p>

      <NuxtLink to="/auth/login">Back to login</NuxtLink>
    </form>
  </div>
</template>

<script setup>
const api = usePixlApi()

const name = ref('')
const userName = ref('')
const email = ref('')
const dateOfBirth = ref('')
const password = ref('')

const loading = ref(false)
const error = ref('')
const message = ref('')

const onSubmit = async () => {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const res = await api.request('/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email: email.value.trim(),
        password: password.value,
        userName: userName.value.trim(),
        name: name.value.trim(),
        dateOfBirth: dateOfBirth.value,
      },
    })

    message.value = res?.message || 'Account created'
  } catch (e) {
    error.value = e?.data?.message || e?.message || 'Signup failed'
  } finally {
    loading.value = false
  }
}
</script>

