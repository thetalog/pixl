<template>
  <div class="overflow-x-auto rounded-card bg-pixl-card ring-1 ring-white/6">
    <table class="min-w-full text-left text-sm">
      <thead class="border-b border-white/6 text-xs uppercase tracking-wide text-pixl-tertiary">
        <tr>
          <th v-if="selectable" class="px-3 py-3">
            <input type="checkbox" :checked="allSelected" @change="$emit('toggle-all', $event.target.checked)" />
          </th>
          <th v-for="col in columns" :key="col.key" class="px-3 py-3 font-medium">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="px-3 py-8">
            <UiSkeleton class="h-8 w-full" />
          </td>
        </tr>
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length + (selectable ? 1 : 0)">
            <UiEmptyState :title="empty" />
          </td>
        </tr>
        <tr
          v-for="row in rows"
          v-else
          :key="row.id || JSON.stringify(row)"
          class="border-t border-white/6 hover:bg-white/4"
          :class="rowHref ? 'cursor-pointer' : ''"
          @click="rowHref ? navigateTo(rowHref(row)) : null"
        >
          <td v-if="selectable" class="px-3 py-3" @click.stop>
            <input
              type="checkbox"
              :checked="selected.includes(row.id)"
              @change="$emit('toggle', row.id, $event.target.checked)"
            />
          </td>
          <td v-for="col in columns" :key="col.key" class="max-w-[240px] truncate px-3 py-3">
            <slot :name="col.key" :row="row">{{ display(row, col) }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  empty: { type: String, default: 'Nothing to show.' },
  selectable: { type: Boolean, default: false },
  selected: { type: Array, default: () => [] },
  rowHref: { type: Function, default: null },
})
defineEmits(['toggle', 'toggle-all'])

const allSelected = computed(() => props.rows.length && props.rows.every((r) => props.selected.includes(r.id)))

function display(row, col) {
  const value = col.key.split('.').reduce((acc, key) => acc?.[key], row)
  if (col.format === 'date' && value) return new Date(value).toLocaleString()
  if (value == null || value === '') return '—'
  return String(value)
}
</script>
