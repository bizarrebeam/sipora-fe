<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { apiAuthGet } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

const loadingStore = useLoadingStore()
import SChip from '@/components/SChip.vue'
import STextField from '@/components/STextField.vue'
import SPagination from '@/components/SPagination.vue'
import STable from '@/components/STable.vue'
import SDatePicker from '@/components/SDatePicker.vue'

interface LogEntry {
  id: string
  pengguna: {
    nama_lengkap: string
    role: string
    is_verified?: boolean
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
const selectedDateObj = ref<Date | null>(null)
const showDatePicker = ref(false)
const selectedModule = ref('semua')

watch(selectedDateObj, (newVal: Date | null) => {
  if (newVal) {
    const yyyy = newVal.getFullYear()
    const mm = String(newVal.getMonth() + 1).padStart(2, '0')
    const dd = String(newVal.getDate()).padStart(2, '0')
    selectedDate.value = `${yyyy}-${mm}-${dd}`
  } else {
    selectedDate.value = ''
  }
  fetchLogs(1)
  showDatePicker.value = false
})

const currentPage = ref(1)
const pageSize = ref(20)
const totalData = ref(0)
const totalPages = ref(1)

const sortKey = ref('waktu')
const sortOrder = ref<'asc' | 'desc'>('desc')

let fetchTimeout: ReturnType<typeof setTimeout>
function debouncedFetch() {
  clearTimeout(fetchTimeout)
  fetchTimeout = setTimeout(() => {
    fetchLogs(1)
  }, 400)
}

watch([sortOrder, searchQuery, selectedDate, selectedModule], () => {
  debouncedFetch()
})

const columns = [
  { key: 'waktu', label: 'Waktu', sortable: true },
  { key: 'pengguna', label: 'Pengguna', sortable: true, tdClass: 'min-w-[200px]' },
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
  // loadingStore.show('Memuat log aktivitas...')
  logError.value = ''
  try {
    const query = new URLSearchParams()
    query.set('page', page.toString())
    query.set('page_size', pageSize.value.toString())
    if (searchQuery.value) query.set('search', searchQuery.value)
    if (selectedDate.value) query.set('tanggal', selectedDate.value)
    if (selectedModule.value) query.set('modul', selectedModule.value)
    
    // Support both 'sort' and 'ordering' for backend compatibility
    if (sortOrder.value) {
      query.set('sort', sortOrder.value)
      query.set('ordering', sortOrder.value === 'desc' ? '-waktu' : 'waktu')
    }

    const res: any = await apiAuthGet(`logs/?${query.toString()}`)
    logs.value = res.results || []
    totalData.value = res.count || 0
    totalPages.value = Math.ceil(totalData.value / pageSize.value) || 1
    currentPage.value = page
  } catch (err: any) {
    logError.value = err.message || 'Gagal memuat log aktivitas.'
  } finally {
    loadingLogs.value = false
    // loadingStore.hide()
  }
}

function handleSearch() {
  debouncedFetch()
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
    
    // Handle date sorting
    if (sortKey.value === 'waktu') {
      valA = new Date(valA).getTime()
      valB = new Date(valB).getTime()
    }
    
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

onMounted(() => {
  if (logs.value.length === 0) {
    fetchLogs(1)
  }
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
        <div class="filters-row">
          <div class="filter-search">
            <STextField 
              v-model="searchQuery" 
              placeholder="Cari nama, aksi, modul, deskripsi..."
              variant="text"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="filter-extras">
            <div class="relative">
              <button 
                type="button"
                class="filter-input flex items-center gap-2 bg-white"
                @click="showDatePicker = !showDatePicker"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {{ selectedDate || 'Pilih Tanggal' }}
              </button>
              <div v-if="showDatePicker" class="absolute right-0 top-[52px] z-50 shadow-xl border rounded-2xl overflow-hidden scale-90 origin-top-right">
                <SDatePicker v-model="selectedDateObj" />
              </div>
            </div>
            <select v-model="sortOrder" class="filter-input" @change="fetchLogs(1)">
              <option value="desc">Terbaru</option>
              <option value="asc">Terlama</option>
            </select>
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
             <div class="flex flex-col items-start gap-1">
                <span class="font-semibold">{{ row.pengguna?.nama_lengkap || (row.deskripsi?.startsWith('Anonim') ? row.deskripsi.split(' membuat')[0] : 'Sistem') }}</span>
                <SChip 
                  v-if="row.pengguna?.role === 'siswa'" 
                  :label="row.pengguna?.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi'" 
                  :tone="row.pengguna?.is_verified ? 'success' : 'warning'" 
                  size="small" 
                />
             </div>
          </template>
          
          <template #body-cell-role="{ row }">
            <SChip
              v-if="row.pengguna?.role === 'siswa'"
              label="Siswa"
              :tone="row.pengguna?.is_verified ? 'success' : 'warning'"
              size="small"
            />
            <SChip
              v-else-if="row.pengguna?.role"
              :label="formatRole(row.pengguna.role)"
              tone="neutral"
              size="small"
            />
            <SChip
              v-else
              :label="row.deskripsi?.startsWith('Anonim') ? 'Anonim' : 'Sistem'"
              tone="neutral"
              size="small"
            />
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

.filters-row {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: stretch;
}
.filter-search { flex: 1; min-width: 0; }
.filter-extras {
  display: flex;
  gap: 12px;
}
.filter-input {
  border: 1px solid var(--color-general-border);
  border-radius: 8px;
  padding: 10px 40px 10px 14px;
  height: 48px;
  font-size: 14px;
  color: var(--color-general-black);
  background: white;
  transition: border-color 0.2s;
  min-width: 140px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}
.filter-input:focus {
  outline: none;
  border-color: var(--color-blue-500);
  box-shadow: 0 0 0 3px rgba(46,48,148,.08);
}

/* ── Mobile (≤ 768px) ── */
@media (max-width: 768px) {
  .filters-row {
    flex-wrap: wrap;
    gap: 10px;
  }
  .filter-extras {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }
  .filter-input {
    flex: 1;
    min-width: 120px;
  }
}

/* ── Small Mobile (≤ 480px) ── */
@media (max-width: 480px) {
  .filter-extras {
    flex-direction: column;
  }
  .filter-input {
    width: 100%;
    min-width: unset;
  }
}

/* ── iPhone SE (≤ 375px) ── */
@media (max-width: 375px) {
  .stf-page-title {
    font-size: 18px;
  }
}
</style>
