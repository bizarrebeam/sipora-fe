<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiAuthGet } from '@/services/api'
import STextField from '@/components/STextField.vue'
import SPagination from '@/components/SPagination.vue'
import STable from '@/components/STable.vue'

interface LogEntry {
  id: string
  pengguna: {
    nama_lengkap: string
    role: string
  } | null
  aksi: string
  deskripsi: string
  modul: string
  waktu: string
  ip_address: string | null
}

const logs = ref<LogEntry[]>([])
const loadingLogs = ref(true)
const logError = ref('')

const searchQuery = ref('')
const selectedDate = ref('')
const selectedModule = ref('semua')

const currentPage = ref(1)
const pageSize = ref(20)
const totalData = ref(0)
const totalPages = ref(1)

const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('desc')

const columns = [
  { key: 'waktu', label: 'Waktu', sortable: true },
  { key: 'pengguna', label: 'Pengguna', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'aksi', label: 'Aksi / Modul', sortable: true },
  { key: 'deskripsi', label: 'Detail Deskripsi', sortable: true },
]

const moduleTabs = [
  { label: 'Semua Sistem', value: 'semua' },
  { label: 'Lap. Kerusakan', value: 'kerusakan' },
  { label: 'Konsultasi BK', value: 'konsultasi_bk' },
  { label: 'Aspirasi', value: 'aspirasi' },
  { label: 'Lap. Bullying', value: 'bullying' },
  { label: 'Artikel', value: 'artikel' },
]

async function fetchLogs(page = 1) {
  loadingLogs.value = true
  logError.value = ''
  try {
    const query = new URLSearchParams()
    query.set('page', page.toString())
    query.set('page_size', pageSize.value.toString())
    if (searchQuery.value) query.set('search', searchQuery.value)
    if (selectedDate.value) query.set('tanggal', selectedDate.value)
    if (selectedModule.value) query.set('modul', selectedModule.value)

    const res: any = await apiAuthGet(`logs/?${query.toString()}`)
    logs.value = res.results || []
    totalData.value = res.count || 0
    totalPages.value = Math.ceil(totalData.value / pageSize.value) || 1
    currentPage.value = page
  } catch (err: any) {
    logError.value = err.message || 'Gagal memuat log aktivitas.'
  } finally {
    loadingLogs.value = false
  }
}

function handleSearch() {
  fetchLogs(1)
}

function handleDateChange(e: Event) {
  selectedDate.value = (e.target as HTMLInputElement).value
  fetchLogs(1)
}

function handleTabChange(mod: string) {
  selectedModule.value = mod
  fetchLogs(1)
}

function formatDate(isoStr: string) {
  const date = new Date(isoStr)
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date)
}

// Map role to label 
function formatRole(role?: string) {
  if (!role) return 'Sistem'
  const map: Record<string, string> = {
    siswa: 'Siswa',
    guru: 'Guru',
    guru_bk: 'Guru BK',
    kemahasiswaan: 'Kemahasiswaan'
  }
  return map[role] || role
}

function sortBy(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const sortedLogs = computed(() => {
  if (!sortKey.value) return logs.value
  
  return [...logs.value].sort((a: any, b: any) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]
    
    // Custom mapping for nested fields
    if (sortKey.value === 'pengguna') {
      valA = a.pengguna?.nama_lengkap || (a.deskripsi?.startsWith('Anonim') ? a.deskripsi.split(' membuat')[0] : 'Sistem')
      valB = b.pengguna?.nama_lengkap || (b.deskripsi?.startsWith('Anonim') ? b.deskripsi.split(' membuat')[0] : 'Sistem')
    } else if (sortKey.value === 'role') {
      valA = formatRole(a.pengguna?.role)
      valB = formatRole(b.pengguna?.role)
    }

    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

onMounted(() => {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  selectedDate.value = `${yyyy}-${mm}-${dd}`
  
  fetchLogs(1)
})
</script>

<template>
  <div class="stf-page">
    <div class="stf-container">
      <div class="stf-header">
        <div class="stf-header-text">
          <h1 class="stf-page-title">Log Aktivitas</h1>
          <p class="stf-page-subtitle">
            Pantau seluruh aktivitas krusial pengguna di dalam sistem Sipora secara real-time.
          </p>
        </div>
      </div>

        <!-- Tabs -->
        <div class="flex flex-wrap gap-2 mb-6">
          <button 
            v-for="tab in moduleTabs" 
            :key="tab.value"
            @click="handleTabChange(tab.value)"
            class="stf-tab-btn"
            :class="selectedModule === tab.value ? 'stf-tab--semua stf-tab-btn--active' : 'stf-tab-btn--inactive'"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Filters -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <div class="flex-1">
            <STextField 
              v-model="searchQuery" 
              placeholder="Cari nama, aksi, modul, deskripsi..."
              variant="text"
              @keyup.enter="handleSearch"
            />
          </div>
          <div>
            <input 
              type="date"
              :value="selectedDate"
              class="border border-gray-300 rounded px-4 py-3 h-[48px] focus:outline-none focus:border-blue-500 text-sm w-full md:w-auto font-display text-[var(--color-general-black)]"
              @change="handleDateChange"
            />
          </div>
        </div>

        <!-- Table -->
        <STable
          :columns="columns"
          :data="sortedLogs"
          :total-data="totalData"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :sort-key="sortKey"
          :sort-order="sortOrder"
          :loading="loadingLogs"
          :error="logError"
          @sort="sortBy"
          @update:currentPage="fetchLogs"
          @update:pageSize="fetchLogs(1)"
        >
          <template #body-cell-waktu="{ row }">
            <span class="text-xs font-mono text-gray-500">{{ formatDate(row.waktu) }}</span>
          </template>
          
          <template #body-cell-pengguna="{ row }">
             <span class="font-semibold">{{ row.pengguna?.nama_lengkap || (row.deskripsi?.startsWith('Anonim') ? row.deskripsi.split(' membuat')[0] : 'Sistem') }}</span>
          </template>
          
          <template #body-cell-role="{ row }">
            <span class="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">
              {{ row.pengguna ? formatRole(row.pengguna?.role) : (row.deskripsi?.startsWith('Anonim') ? 'Anonim' : 'Sistem') }}
            </span>
          </template>
          
          <template #body-cell-aksi="{ row }">
            <div class="font-bold text-blue-600">{{ row.aksi }}</div>
            <div class="text-xs text-gray-400 mt-1 uppercase">{{ row.modul }}</div>
          </template>
          
          <template #body-cell-deskripsi="{ row }">
             <div class="min-w-[300px] leading-relaxed">{{ row.deskripsi }}</div>
          </template>
        </STable>

      </div>
    </div>
</template>

<style scoped>
.font-display {
  font-family: "Be Vietnam Pro", sans-serif;
}
</style>
