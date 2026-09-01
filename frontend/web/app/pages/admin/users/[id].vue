<template>
  <div v-if="detail">
    <AdminPageHeader :title="`@${detail.user.userName}`" :subtitle="detail.user.email" :crumbs="[{ to: '/admin/users', label: 'Users' }]" />
    <div class="mb-4 flex flex-wrap gap-2">
      <AdminStatusBadge :value="detail.user.accountStatus" />
      <AdminStatusBadge :value="detail.user.roleKey" />
      <span class="text-sm text-pixl-muted">Joined {{ new Date(detail.user.createdAt).toLocaleDateString() }}</span>
    </div>
    <div class="mb-6 flex flex-wrap gap-2">
      <UiButton v-if="admin.can('moderation.act')" size="sm" @click="open('warn')">Warn</UiButton>
      <UiButton v-if="admin.can('users.suspend')" size="sm" variant="secondary" @click="open('suspend')">Suspend</UiButton>
      <UiButton v-if="admin.can('users.ban')" size="sm" variant="danger" @click="open('ban')">Ban</UiButton>
      <UiButton v-if="admin.can('users.unban')" size="sm" variant="secondary" @click="open('unban')">Unban / restore</UiButton>
      <UiButton v-if="admin.can('users.suspend')" size="sm" variant="ghost" @click="open('force_logout')">Force logout</UiButton>
      <UiButton v-if="admin.can('livestreams.restrict')" size="sm" variant="secondary" @click="openRestrict">Restrict live</UiButton>
      <UiButton v-if="admin.can('users.impersonate')" size="sm" variant="danger" @click="open('impersonate')">Impersonate</UiButton>
      <UiButton v-if="admin.can('moderation.act')" size="sm" variant="ghost" @click="open('note')">Add note</UiButton>
    </div>
    <div class="grid gap-4 lg:grid-cols-2">
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <h2 class="mb-3 font-semibold">Account</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between"><dt class="text-pixl-muted">Verified</dt><dd>{{ detail.user.isEmailVerified ? 'Yes' : 'No' }}</dd></div>
          <div class="flex justify-between"><dt class="text-pixl-muted">Last login</dt><dd>{{ detail.user.lastLoginAt ? new Date(detail.user.lastLoginAt).toLocaleString() : '—' }}</dd></div>
          <div class="flex justify-between"><dt class="text-pixl-muted">Live revoked</dt><dd>{{ detail.user.livePrivilegesRevoked ? 'Yes' : 'No' }}</dd></div>
          <div class="flex justify-between"><dt class="text-pixl-muted">Comments locked</dt><dd>{{ detail.user.commentsLocked ? 'Yes' : 'No' }}</dd></div>
        </dl>
        <div v-if="admin.can('admins.edit') || admin.can('moderators.edit')" class="mt-4 space-y-2">
          <label class="block text-sm text-pixl-muted">Role
            <select v-model="roleKey" class="mt-1 h-10 w-full rounded-control border border-white/8 bg-pixl-elevated px-3">
              <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
            </select>
          </label>
          <UiButton size="sm" @click="saveRole">Save role</UiButton>
        </div>
      </section>
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <h2 class="mb-3 font-semibold">Notes</h2>
        <ul class="space-y-2 text-sm text-pixl-muted">
          <li v-for="n in detail.notes" :key="n.id">{{ n.body }} <span class="text-pixl-tertiary">{{ new Date(n.createdAt).toLocaleString() }}</span></li>
          <li v-if="!detail.notes.length">No notes.</li>
        </ul>
      </section>
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <h2 class="mb-3 font-semibold">Reports</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="r in detail.reports" :key="r.id">
            <NuxtLink :to="`/admin/reports/${r.id}`" class="text-pixl-accent-2">{{ r.category }} · {{ r.status }}</NuxtLink>
          </li>
          <li v-if="!detail.reports.length" class="text-pixl-muted">None.</li>
        </ul>
      </section>
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <h2 class="mb-3 font-semibold">Moderation history</h2>
        <ul class="space-y-2 text-sm text-pixl-muted">
          <li v-for="a in detail.moderationHistory" :key="a.id">{{ a.type }} · {{ a.reason }}</li>
          <li v-if="!detail.moderationHistory.length">None.</li>
        </ul>
      </section>
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <h2 class="mb-3 font-semibold">Strikes</h2>
        <ul class="space-y-2 text-sm text-pixl-muted">
          <li v-for="s in detail.strikes" :key="s.id">{{ s.type }} · {{ s.reason }}</li>
          <li v-if="!detail.strikes.length">None.</li>
        </ul>
      </section>
      <section class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <h2 class="mb-3 font-semibold">Appeals</h2>
        <ul class="space-y-2 text-sm">
          <li v-for="a in detail.appeals" :key="a.id">{{ a.type }} · {{ a.status }}</li>
          <li v-if="!detail.appeals.length" class="text-pixl-muted">None.</li>
        </ul>
      </section>
    </div>
    <AdminConfirmDialog
      :open="!!pending"
      :title="pendingTitle"
      :message="pendingMessage"
      :danger="['ban', 'impersonate', 'delete'].includes(pending)"
      :confirm-word="pending === 'ban' ? 'BAN' : pending === 'impersonate' ? 'IMPERSONATE' : ''"
      :loading="working"
      @close="pending = ''"
      @confirm="run"
    />
  </div>
  <UiEmptyState v-else-if="!loading" title="User not found." />
  <UiSkeleton v-else class="h-40" />
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const route = useRoute()
const admin = useAdmin()
const toast = useToast()
const detail = ref(null)
const loading = ref(true)
const pending = ref('')
const working = ref(false)
const roleKey = ref('USER')
const roles = ['USER', 'SUPPORT', 'ANALYST', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']

const pendingTitle = computed(() => pending.value ? pending.value.replace('_', ' ') : '')
const pendingMessage = computed(() => `This action on @${detail.value?.user?.userName} is audited.`)

async function load() {
  loading.value = true
  try {
    detail.value = await admin.get(`/admin/users/${route.params.id}`)
    roleKey.value = detail.value.user.roleKey
  } finally {
    loading.value = false
  }
}
onMounted(load)
function open(action) { pending.value = action }
function openRestrict() { pending.value = 'restrict' }

async function run({ reason }) {
  working.value = true
  try {
    if (pending.value === 'impersonate') {
      const data = await admin.post(`/admin/users/${route.params.id}/impersonate`, { reason })
      await admin.persistToken(data)
      toast.success('Impersonation started')
      await navigateTo('/')
      return
    }
    if (pending.value === 'restrict') {
      await admin.act(`/admin/livestreams/hosts/${route.params.id}/restrict`, { reason, revoked: true }, { success: 'Live privileges revoked' })
    } else {
      await admin.act(`/admin/users/${route.params.id}/actions`, { action: pending.value, reason }, { success: 'Updated' })
    }
    pending.value = ''
    await load()
  } finally {
    working.value = false
  }
}

async function saveRole() {
  await admin.act(`/admin/users/${route.params.id}/role`, { roleKey: roleKey.value, reason: 'Staff role change from admin console' }, { success: 'Role updated' })
  await load()
}
</script>
