<script setup lang="ts">
import { computed } from 'vue'
import SPagination from './SPagination.vue'

interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  tdClass?: string
}

const props = defineProps<{
  columns: TableColumn[]
  data: any[]
  totalData: number
  currentPage: number
  pageSize: number
  loading?: boolean
  error?: string
  emptyMessage?: string
  sortKey?: string
  sortOrder?: 'asc' | 'desc'
}>()

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
  (e: 'update:pageSize', size: number): void
  (e: 'sort', key: string): void
}>()

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.totalData / props.pageSize))
})

const startDataIndex = computed(() => {
  if (props.totalData === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

const endDataIndex = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalData)
})

function onPageSizeChange(e: Event) {
  const size = parseInt((e.target as HTMLSelectElement).value, 10)
  emit('update:pageSize', size)
}
</script>

<template>
  <div class="s-table-container">
    <div class="flex items-center justify-between mb-4 font-display text-sm text-[var(--color-general-black)]">
      <div class="flex items-center gap-2">
        <select 
          class="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white"
          :value="pageSize"
          @change="onPageSizeChange"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span>data per halaman</span>
      </div>
      <div class="text-gray-500 hidden sm:block">
        Menampilkan {{ startDataIndex }} - {{ endDataIndex }} dari {{ totalData }}
      </div>
    </div>

    <div 
      class="bg-white rounded-lg shadow border border-gray-100 relative"
      :class="{ 'opacity-60 pointer-events-none': loading && data.length > 0 }"
    >
      <div v-if="loading && data.length === 0" class="p-8 text-center text-gray-400 font-display min-h-[200px] flex items-center justify-center">
        Memuat data...
      </div>
      <div v-else-if="error" class="p-8 text-center text-red-500 font-display min-h-[200px] flex items-center justify-center">
        {{ error }}
      </div>
      <div v-else-if="data.length === 0" class="s-empty-state min-h-[300px]">
        <svg class="s-empty-state__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="s-empty-state__title">Data Tidak Ditemukan</h3>
        <p class="s-empty-state__desc">{{ emptyMessage || 'Tidak ada data yang tersedia saat ini.' }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm font-display whitespace-nowrap">
          <thead class="bg-gray-50 text-gray-600 border-b border-gray-100 uppercase text-xs select-none">
            <tr>
              <th 
                v-for="col in columns" 
                :key="col.key"
                class="px-6 py-4 font-bold"
                :class="{ 'cursor-pointer hover:bg-gray-100 transition-colors group': col.sortable }"
                @click="col.sortable && emit('sort', col.key)"
              >
                <div class="flex items-center gap-2">
                  <span>{{ col.label }}</span>
                  <span v-if="col.sortable" class="text-gray-400 group-hover:text-gray-600">
                    <svg v-if="sortKey === col.key && sortOrder === 'desc'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    <svg v-else-if="sortKey === col.key && sortOrder === 'asc'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-gray-800">
            <tr v-for="(row, idx) in data" :key="row.id || idx" class="hover:bg-gray-50 transition-colors">
              <td v-for="col in columns" :key="col.key" class="px-6 py-4 whitespace-normal" :class="col.tdClass">
                <slot :name="`body-cell-${col.key}`" :row="row">
                  {{ row[col.key] }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="!loading && totalPages > 1 && data.length > 0" class="px-6 py-4 border-t border-gray-100 flex flex-col items-center gap-4">
        <div class="w-full flex justify-center">
          <SPagination 
            :modelValue="currentPage"
            :totalPages="totalPages"
            @update:modelValue="p => emit('update:currentPage', p)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-display {
  font-family: "Be Vietnam Pro", sans-serif;
}
</style>