<template>
  <section v-if="visibleUsers.length" class="mt-4 border-b border-white/6 pb-4">
    <div class="mb-3 flex items-center justify-between px-1">
      <h2 class="text-sm font-semibold text-pixl-text">Suggested for you</h2>
      <NuxtLink to="/discover/people" class="text-xs font-semibold text-pixl-accent hover:text-pixl-accent-2">
        See all
      </NuxtLink>
    </div>

    <div class="flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-hide">
      <article
        v-for="user in visibleUsers"
        :key="user.id"
        class="relative flex w-[156px] shrink-0 flex-col items-center rounded-card bg-pixl-card px-3 py-4 ring-1 ring-white/6"
      >
        <button
          type="button"
          class="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-pixl-muted hover:bg-white/6 hover:text-pixl-text"
          aria-label="Dismiss suggestion"
          @click="dismiss(user.id)"
        >
          <UiIcon name="close" :size="14" />
        </button>

        <NuxtLink :to="`/profile/${user.userName}`" class="flex flex-col items-center">
          <UiAvatar :src="user.profilePic" :alt="user.userName" :size="64" />
          <p class="mt-3 max-w-full truncate text-sm font-semibold text-pixl-text">
            {{ user.userName }}
          </p>
          <p class="mt-0.5 line-clamp-2 min-h-[2rem] text-center text-xs text-pixl-muted">
            {{ user.reason || 'Suggested for you' }}
          </p>
        </NuxtLink>

        <UiFollowButton
          class="mt-3 w-full"
          :username="user.userName"
          block
          @change="onFollowChange(user, $event)"
        />
      </article>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  users: { type: Array, default: () => [] },
})

const dismissed = ref(new Set())

const visibleUsers = computed(() =>
  (Array.isArray(props.users) ? props.users : []).filter((u) => u?.id && !dismissed.value.has(u.id))
)

function dismiss(id) {
  dismissed.value = new Set([...dismissed.value, id])
}

function onFollowChange(user, { isFollow, isRequested }) {
  if (isFollow || isRequested) dismiss(user.id)
}
</script>
