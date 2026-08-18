<template>
  <svg
    class="shrink-0"
    :style="{ width: `${Number(size) || 22}px`, height: `${Number(size) || 22}px` }"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      v-if="name === 'home'"
      d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
      :fill="filled ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'search'"
      d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm10 16.5-4.2-4.2"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
    />
    <path
      v-else-if="name === 'reels'"
      d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v13A2.5 2.5 0 0 1 16.5 21h-9A2.5 2.5 0 0 1 5 18.5v-13ZM10 9.2v5.6L15 12 10 9.2Z"
      :fill="filled ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'message'"
      d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H12l-4.2 3.2V16H7.5A2.5 2.5 0 0 1 5 13.5v-7Z"
      :fill="filled ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'heart'"
      d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
      :fill="filled ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'plus'"
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
    <path
      v-else-if="name === 'user'"
      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.2 0-8 2.1-8 4.8V21h16v-2.2C20 16.1 16.2 14 12 14Z"
      :fill="filled ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'settings'"
      d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4ZM4.5 13.2l1.7.4a6.8 6.8 0 0 0 .6 1.5l-1 1.5 1.7 1.7 1.5-1c.5.3 1 .5 1.5.6l.4 1.7h2.4l.4-1.7c.5-.1 1-.3 1.5-.6l1.5 1 1.7-1.7-1-1.5c.3-.5.5-1 .6-1.5l1.7-.4v-2.4l-1.7-.4a6.8 6.8 0 0 0-.6-1.5l1-1.5-1.7-1.7-1.5 1a6.8 6.8 0 0 0-1.5-.6L13.2 4.5H10.8l-.4 1.7c-.5.1-1 .3-1.5.6l-1.5-1-1.7 1.7 1 1.5a6.8 6.8 0 0 0-.6 1.5l-1.7.4v2.4Z"
      :fill="filled ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'live'"
      d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0-4a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z"
      stroke="currentColor"
      stroke-width="1.7"
    />
    <path
      v-else-if="name === 'bell'"
      d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Zm6 11a2.4 2.4 0 0 0 2.3-1.8H9.7A2.4 2.4 0 0 0 12 20Z"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'send'"
      d="M4 12 20 4l-6 16-2.4-6.2L4 12Z"
      :fill="filled ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'bookmark'"
      d="M7 4h10a1 1 0 0 1 1 1v16l-6-3.4L6 21V5a1 1 0 0 1 1-1Z"
      :fill="filled ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'comment'"
      d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5V14a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3V16.5H7.5A2.5 2.5 0 0 1 5 14V6.5Z"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'more'"
      d="M6 12.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
      fill="currentColor"
    />
    <path
      v-else-if="name === 'close'"
      d="M6 6l12 12M18 6 6 18"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
    <path
      v-else-if="name === 'back'"
      d="M15 5 8 12l7 7"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'image'"
      d="M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 17.5v-11ZM8 14l2.5-3 2 2.5L15 11l4 5H5l3-2Z"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linejoin="round"
    />
    <path
      v-else-if="name === 'play'"
      d="M9 7.5v9L17 12 9 7.5Z"
      fill="currentColor"
    />
    <path
      v-else
      d="M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0"
      stroke="currentColor"
      stroke-width="1.7"
    />
  </svg>
</template>

<script setup>
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 22 },
  filled: { type: Boolean, default: false },
})

</script>
