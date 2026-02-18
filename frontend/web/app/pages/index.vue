<script setup>
const { isLoggedIn, username, logout } = useAuth()
</script>

<template>
  <div style="padding: 16px; max-width: 720px">
    <h1>Pixl Web</h1>
    <p>Web client for the Pixl REST API.</p>

    <div v-if="isLoggedIn" style="margin-top: 16px">
      <p v-if="username">Logged in as: <b>{{ username }}</b></p>
      <div style="display: flex; gap: 12px; align-items: center">
        <NuxtLink to="/home">Home</NuxtLink>
        <NuxtLink to="/messages">Messages</NuxtLink>
        <button type="button" @click="logout">Logout</button>
      </div>
    </div>

    <div v-else style="margin-top: 16px; display: flex; gap: 12px">
      <NuxtLink to="/auth/login">Login</NuxtLink>
      <NuxtLink to="/auth/signup">Signup</NuxtLink>
    </div>
  </div>
</template>
