<template>
  <div class="flex items-center gap-2">
    <UiButton size="sm" variant="secondary" @click="$emit('toggle-mic')">
      {{ micOn ? 'Mute' : 'Unmute' }}
    </UiButton>
    <UiButton size="sm" variant="secondary" @click="$emit('toggle-camera')">
      {{ cameraOn ? 'Camera off' : 'Camera on' }}
    </UiButton>
    <UiButton size="sm" variant="ghost" @click="$emit('switch-camera')">Flip</UiButton>
    <UiButton v-if="showEnd" size="sm" variant="danger" :loading="ending" @click="$emit('end')">End</UiButton>
  </div>
</template>

<script setup>
defineProps({
  micOn: { type: Boolean, default: true },
  cameraOn: { type: Boolean, default: true },
  ending: { type: Boolean, default: false },
  showEnd: { type: Boolean, default: true },
})
defineEmits(['toggle-mic', 'toggle-camera', 'switch-camera', 'end'])
</script>
