<template>
  <div>
    <AdminPageHeader title="Roles & permissions" subtitle="System roles cannot be archived. Dangerous permissions are highlighted." />
    <div class="mb-4">
      <UiButton v-if="admin.can('admins.edit')" size="sm" @click="createOpen = true">Create role</UiButton>
    </div>
    <div class="space-y-4">
      <section v-for="role in roles" :key="role.id" class="rounded-card bg-pixl-card p-4 ring-1 ring-white/6">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="font-semibold">{{ role.name }} <span class="text-xs text-pixl-tertiary">{{ role.key }}</span></h2>
            <p class="text-sm text-pixl-muted">{{ role.description }} · {{ role.staffCount }} staff · rank {{ role.rank }}</p>
          </div>
          <div class="flex gap-2">
            <UiButton v-if="admin.can('admins.edit')" size="sm" variant="secondary" @click="edit(role)">Edit</UiButton>
            <UiButton v-if="admin.can('admins.edit')" size="sm" variant="ghost" @click="dup(role)">Duplicate</UiButton>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-1">
          <span v-for="p in role.permissions" :key="p" class="rounded-full px-2 py-0.5 text-[11px]" :class="dangerous(p) ? 'bg-pixl-danger/15 text-pixl-danger' : 'bg-white/8 text-pixl-muted'">
            {{ p }}
          </span>
        </div>
      </section>
    </div>
    <UiModal :open="!!editing || createOpen" :title="editing ? 'Edit role' : 'Create role'" @close="close">
      <div class="space-y-3">
        <UiTextField v-if="!editing" v-model="form.key" label="Key" placeholder="TRUST_AND_SAFETY" />
        <UiTextField v-model="form.name" label="Name" />
        <UiTextField v-model="form.description" label="Description" multiline />
        <p class="text-xs text-pixl-muted">Permissions are assigned as a set. Super admin always has every permission.</p>
        <div class="max-h-64 overflow-auto rounded-control bg-pixl-elevated p-3 text-xs">
          <label v-for="p in catalog" :key="p.key" class="mb-1 flex items-center gap-2">
            <input v-model="form.permissions" type="checkbox" :value="p.key" />
            <span :class="p.dangerous ? 'text-pixl-danger' : ''">{{ p.label }} ({{ p.key }})</span>
          </label>
        </div>
        <UiButton :loading="saving" @click="save">Save</UiButton>
      </div>
    </UiModal>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin', middleware: ['auth', 'staff'] })
const admin = useAdmin()
const roles = ref([])
const catalog = ref([])
const editing = ref(null)
const createOpen = ref(false)
const saving = ref(false)
const form = reactive({ key: '', name: '', description: '', permissions: [] })
function dangerous(key) {
  return catalog.value.find((p) => p.key === key)?.dangerous
}
async function load() {
  roles.value = await admin.get('/admin/roles')
  const meta = await admin.get('/admin/meta').catch(() => ({ permissions: [] }))
  catalog.value = meta.permissions || []
}
onMounted(load)
function edit(role) {
  editing.value = role
  form.name = role.name
  form.description = role.description
  form.permissions = [...(role.permissions || [])]
}
async function dup(role) {
  await admin.act(`/admin/roles/${role.id}/duplicate`, {}, { success: 'Role duplicated' })
  await load()
}
function close() {
  editing.value = null
  createOpen.value = false
}
async function save() {
  saving.value = true
  try {
    if (editing.value) {
      await admin.act(`/admin/roles/${editing.value.id}`, { ...form, reason: 'Role updated in console' }, { success: 'Role saved' })
    } else {
      await admin.act('/admin/roles', { ...form, reason: 'Role created in console' }, { success: 'Role created' })
    }
    close()
    await load()
  } finally {
    saving.value = false
  }
}
</script>
