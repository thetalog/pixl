<template>
  <div class="flex h-screen bg-primary">
    <!-- Sidebar Navigation -->
    <nav class="w-64 bg-secondary border-r border-gray-700 flex flex-col overflow-y-auto">
      <!-- Logo -->
      <div class="p-6 border-b border-gray-700">
        <h1 class="text-2xl font-bold text-accent">Pixl</h1>
      </div>

      <!-- Navigation Links -->
      <ul class="flex-1 p-4 space-y-2">
        <li>
          <NuxtLink
            to="/home"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-primary text-white"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h3m10-11l2 3m-2-3v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            Home
          </NuxtLink>
        </li>

        <li>
          <NuxtLink
            to="/explore"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-primary text-white"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            Explore
          </NuxtLink>
        </li>

        <li>
          <NuxtLink
            to="/live"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-primary text-white"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Live
          </NuxtLink>
        </li>

        <li>
          <NuxtLink
            to="/messages"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-primary text-white"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            Messages
          </NuxtLink>
        </li>

        <li>
          <NuxtLink
            to="/profile"
            class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-primary text-white"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Profile
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="bg-secondary border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search users, posts..."
            class="px-4 py-2 bg-primary border border-gray-600 rounded-lg text-white placeholder-gray-400 w-64"
          />
        </div>

        <div class="flex items-center gap-4">
          <!-- Notifications -->
          <button class="relative hover:opacity-75 transition-opacity text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
          </button>

          <!-- User Avatar -->
          <div class="w-8 h-8 rounded-full bg-accent flex items-center justify-center cursor-pointer hover:opacity-75">
            <span class="text-white text-sm font-bold">U</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Layout without store dependencies for initial testing
</script>
