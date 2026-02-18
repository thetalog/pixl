<template>
  <div style="padding: 16px">
    <h1>Pixl Web</h1>
    <p v-if="username">Logged in as: <b>{{ username }}</b></p>

    <div style="display: flex; gap: 12px; margin-top: 16px">
      <NuxtLink to="/messages">Messages</NuxtLink>
      <button type="button" @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: ['auth'] })

const { username, logout } = useAuth()
</script>

