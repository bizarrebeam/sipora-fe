<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SModal from '@/components/SModal.vue'
import STextField from '@/components/STextField.vue'
import STable from '@/components/STable.vue'
import SLoading from '@/components/SLoading.vue'
import SChip from '@/components/SChip.vue'
import SDialog from '@/components/SDialog.vue'
import SAlert from '@/components/SAlert.vue'
import SPagination from '@/components/SPagination.vue'
import { useAuthStore } from '@/stores/auth'
import { useLaporanPeriodikStore } from '@/stores/laporanPeriodik'
import { useAutoRefresh } from '@/composables/useAutoRefresh'

interface Report {
  id: string
  judul: string
  tanggal: string
  kategori: string
  status: string
  no_laporan: string
  tipe_laporan: string
}

interface Summary {
  total_reports: number
  bullying_count: number
  kerusakan_count: number
  status_distribution: Record<string, number>
  kategori_distribution: Record<string, number>
}

interface Column {
  key: string
  label: string
  sortable?: boolean
}

const auth = useAuthStore()
const laporanStore = useLaporanPeriodikStore()
const router = useRouter()
const route = useRoute()

const isKemahasiswaan = computed(() => auth.user?.role === 'kemahasiswaan')
const showUnauthorizedDialog = ref<boolean>(false)
const showAlert = ref<boolean>(false)
const alertMessage = ref<string>('')
const alertType = ref<'default' | 'warning'>('default')

// Export state
const isExporting = ref<boolean>(false)
const exportError = ref<string>('')

// Modal state - Filter
const showFilterModal = ref<boolean>(false)
const filterStartDate = ref<string>('')
const filterEndDate = ref<string>('')
const filterStartDateError = ref<string>('')
const filterEndDateError = ref<string>('')

// Modal state - Export PDF
const showExportModal = ref<boolean>(false)
const exportStartDate = ref<string>('')
const exportEndDate = ref<string>('')
const exportStartDateError = ref<string>('')
const exportEndDateError = ref<string>('')

// Current filter dates (for fetching data)
const currentStartDate = ref<string>('')
const currentEndDate = ref<string>('')

// Filter dropdowns
const sortBy = ref<string>('tanggal_desc')
const categoryFilter = ref<string>('semua')

const categoryOptions = [
  { label: 'Semua Kategori', value: 'semua' },
  { label: 'Bullying', value: 'bullying' },
  { label: 'Kerusakan Fasilitas', value: 'kerusakan' },
]

// Initialize dates to current month
function initializeDates(): void {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  
  currentEndDate.value = today.toISOString().substring(0, 10)
  currentStartDate.value = firstDay.toISOString().substring(0, 10)
}

function validateFilterDates(): boolean {
  filterStartDateError.value = ''
  filterEndDateError.value = ''
  
  if (!filterStartDate.value) {
    filterStartDateError.value = 'Tanggal mulai harus diisi'
    return false
  }
  
  if (!filterEndDate.value) {
    filterEndDateError.value = 'Tanggal akhir harus diisi'
    return false
  }
  
  if (filterStartDate.value > filterEndDate.value) {
    filterStartDateError.value = 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir'
    return false
  }
  
  return true
}

function validateExportDates(): boolean {
  exportStartDateError.value = ''
  exportEndDateError.value = ''
  
  if (!exportStartDate.value) {
    exportStartDateError.value = 'Tanggal mulai harus diisi'
    return false
  }
  
  if (!exportEndDate.value) {
    exportEndDateError.value = 'Tanggal akhir harus diisi'
    return false
  }
  
  if (exportStartDate.value > exportEndDate.value) {
    exportStartDateError.value = 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir'
    return false
  }
  
  return true
}

function applyFilter(): void {
  if (validateFilterDates()) {
    currentStartDate.value = filterStartDate.value
    currentEndDate.value = filterEndDate.value
    showFilterModal.value = false
    fetchReports()
  }
}

function resetFilterModal(): void {
  filterStartDate.value = currentStartDate.value
  filterEndDate.value = currentEndDate.value
  filterStartDateError.value = ''
  filterEndDateError.value = ''
}

function resetExportModal(): void {
  exportStartDate.value = currentStartDate.value
  exportEndDate.value = currentEndDate.value
  exportStartDateError.value = ''
  exportEndDateError.value = ''
}

async function fetchReports(): Promise<void> {
  await laporanStore.fetchLaporanPeriodik(
    currentStartDate.value,
    currentEndDate.value,
    categoryFilter.value === 'semua' ? '' : categoryFilter.value
  )
}

async function exportPDF(): Promise<void> {
  isExporting.value = true
  exportError.value = ''

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
    const url = new URL(`${API_BASE_URL}laporan/export/`, window.location.origin)
    
    // Add query parameters
    url.searchParams.append('start_date', exportStartDate.value)
    url.searchParams.append('end_date', exportEndDate.value)
    
    if (categoryFilter.value !== 'semua') {
      url.searchParams.append('kategori_laporan', categoryFilter.value)
    }

    // Build headers
    const headers: HeadersInit = {
      'Accept': 'application/pdf',
    }
    
    // Add Authorization header if token exists in localStorage
    const token = localStorage.getItem('access_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Fetch the PDF
    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData?.error || errorData?.detail ||
        'Gagal membuat laporan, silakan coba lagi'
      )
    }

    // Get filename from content-disposition header or use default
    const contentDisposition = response.headers.get('content-disposition')
    let filename = 'Laporan_Bulanan.pdf'
    
    if (contentDisposition) {
      // Try RFC 5987 format first (filename*=UTF-8''...)
      const rfc5987Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/)
      if (rfc5987Match && rfc5987Match[1]) {
        filename = decodeURIComponent(rfc5987Match[1])
      } else {
        // Fallback to standard format (filename="...")
        const standardMatch = contentDisposition.match(/filename="?([^";\r\n]+)"?/)
        if (standardMatch && standardMatch[1]) {
          filename = standardMatch[1]
        }
      }
    }

    // Create blob and download
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)

    // Show success message
    showAlert.value = true
    alertMessage.value = 'Laporan berhasil diunduh'
    alertType.value = 'default'
    
    // Close modal
    showExportModal.value = false

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Gagal membuat laporan, silakan coba lagi'
    exportError.value = errorMessage
    showAlert.value = true
    alertMessage.value = errorMessage
    alertType.value = 'warning'
    console.error('Export PDF error:', error)
  } finally {
    isExporting.value = false
  }
}

function handleExportClick(): void {
  if (validateExportDates()) {
    exportPDF()
  }
}

// Status mapping
function statusLabel(status: string): string {
  const map: Record<string, string> = {
    'menunggu': 'Menunggu Konfirmasi',
    'diproses': 'Diproses',
    'menunggu_konfirmasi_selesai': 'Menunggu Konfirmasi Selesai',
    'selesai': 'Selesai',
    'ditolak': 'Ditolak',
    'dibatalkan': 'Dibatalkan',
    'ditandai': 'Ditandai',
  }
  return map[status] || status
}

function statusTone(status: string): 'warning' | 'info' | 'success' | 'danger' {
  if (status === 'menunggu' || status === 'menunggu_konfirmasi_selesai') return 'warning'
  if (status === 'diproses') return 'info'
  if (status === 'selesai') return 'success'
  if (status === 'ditandai') return 'success'
  return 'danger'
}

// Format kategori display
function formatCategory(kategori: string, tipelaporan?: string): string {
  const map: Record<string, string> = {
    'verbal': 'Bullying Verbal',
    'fisik': 'Bullying Fisik',
    'sosial': 'Bullying Sosial',
    'cyber': 'Cyberbullying',
    'seksual': 'Kekerasan Seksual',
    'lainnya': 'Lainnya',
    'sarana': 'Sarana & Prasarana',
    'kurikulum': 'Kurikulum & Pembelajaran',
    'layanan': 'Layanan Infrastruktur',
    'ekstrakulikuler': 'Ekstrakulikuler & Bakat',
    'kesehatan': 'Kesehatan & Keamanan',
  }
  return map[kategori] || kategori
}

// Format date
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
  return d.toLocaleString('id-ID', options)
}

// Sort reports
function sortReports(reports: Report[]): Report[] {
  const sorted = [...reports]
  
  if (sortBy.value === 'tanggal_desc') {
    sorted.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
  } else if (sortBy.value === 'tanggal_asc') {
    sorted.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
  } else if (sortBy.value === 'judul_asc') {
    sorted.sort((a, b) => a.judul.localeCompare(b.judul))
  }
  
  return sorted
}

// Table columns (not used with native table, kept for reference)
// const columns: Column[] = [...]

const reports = computed(() => laporanStore.reports)
const summary = computed(() => laporanStore.summary)
const loading = computed(() => laporanStore.loading)

// Sorting
const sortedReports = computed(() => sortReports(reports.value))

// Pagination
const currentPage = ref<number>(1)
const pageSize = ref<number>(10)

const totalData = computed(() => sortedReports.value.length)
const totalPages = computed(() => Math.ceil(totalData.value / pageSize.value))

// Pie chart data for status distribution
const statusChartData = computed(() => {
  const data = summary.value.status_distribution || {}
  return {
    series: Object.values(data),
    labels: Object.keys(data).map(k => statusLabel(k)),
  }
})

// Pagination calculations
const startIndex = computed(() => (currentPage.value - 1) * pageSize.value)
const endIndex = computed(() => Math.min(currentPage.value * pageSize.value, totalData.value))

// Report list for current page
const reportList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedReports.value.slice(start, end)
})

// Handle sort change
function handleSortChange(value: string): void {
  sortBy.value = value
  currentPage.value = 1
}

// Reset all filters and refresh
function handleRefresh(): void {
  sortBy.value = 'tanggal_desc'
  categoryFilter.value = 'semua'
  resetFilterModal()
  fetchReports()
}

// Handle alert close
function handleAlertClose(): void {
  showAlert.value = false
}

onMounted(() => {
  if (!isKemahasiswaan.value) {
    showUnauthorizedDialog.value = true
    return
  }
  
  if (route.query.unauthorized) {
    showUnauthorizedDialog.value = true
    const query = { ...route.query }
    delete query.unauthorized
    router.replace({ query })
    return
  }
  
  initializeDates()
  filterStartDate.value = currentStartDate.value
  filterEndDate.value = currentEndDate.value
  exportStartDate.value = currentStartDate.value
  exportEndDate.value = currentEndDate.value
  fetchReports()
})

useAutoRefresh(() => fetchReports(), {
  intervalMs: 30_000,
  refetchOnVisible: true,
})
</script>

<template>
    <!-- Unauthorized Dialog -->
    <SDialog 
        :visible="showUnauthorizedDialog"
        variant="danger"
        title="Akses Ditolak"
        message="Anda tidak memiliki akses ke halaman ini. Hanya staff Kemahasiswaan yang dapat mengakses Laporan Periodik."
        cancel-label="Kembali ke Beranda"
        @cancel="router.push('/')"
        persistent
    />

    <!-- Alert Message -->
    <SAlert
        :visible="showAlert"
        :type="alertType"
        :description="alertMessage"
        title="Notifikasi"
        primary-button-text="Tutup"
        @update:visible="showAlert = $event"
        @primary-click="handleAlertClose"
        @close="handleAlertClose"
    />

    <div v-if="isKemahasiswaan" class="stf-page">
        <div class="stf-container">
            <!-- Header -->
            <div class="stf-header">
                <div class="stf-header-text">
                    <h1 class="stf-page-title">Laporan Periodik</h1>
                    <p class="stf-page-subtitle">
                        Lihat ringkasan laporan bullying, kerusakan, dan aspirasi dalam periode waktu tertentu.
                    </p>
                </div>
                <SButton 
                    label="Cetak Laporan" 
                    variant="primary"
                    @click="showExportModal = true"
                />
            </div>

            <!-- Main Table Card -->
            <SCard class="section-card">
                <!-- header removed per request; controls moved into toolbar below -->

                <!-- Toolbar / Controls -->
                <div class="filter-extras">
                    <div class="filter-group">
                        <label class="text-xs font-semibold text-gray-700 block mb-2">Urutkan</label>
                        <select v-model="sortBy" class="filter-input" @change="handleSortChange(sortBy)">
                            <option value="tanggal_desc">Tanggal Terbaru</option>
                            <option value="tanggal_asc">Tanggal Terlama</option>
                            <option value="judul_asc">Laporan A-Z</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="text-xs font-semibold text-gray-700 block mb-2">Kategori</label>
                        <select v-model="categoryFilter" class="filter-input" @change="fetchReports">
                            <option value="semua">Semua Kategori</option>
                            <option value="bullying">Bullying</option>
                            <option value="kerusakan">Kerusakan Fasilitas</option>
                        </select>
                    </div>

                    <div class="filter-date-range">
                        <span class="text-xs text-gray-600 font-medium">
                            {{ currentStartDate }} - {{ currentEndDate }}
                        </span>
                    </div>

                    <div class="filter-actions">
                        <button type="button" class="filter-button" @click="handleRefresh">Refresh</button>
                        <button type="button" class="filter-button" @click="showFilterModal = true">Filter</button>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="loading && sortedReports.length === 0" class="flex items-center justify-center py-16">
                    <div class="text-center">
                        <SLoading />
                        <p class="text-gray-500 mt-4">Memuat data laporan...</p>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="!loading && reportList.length === 0" class="flex flex-col items-center justify-center py-16 text-center px-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300 mb-4">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path>
                    </svg>
                    <p class="text-gray-600 font-semibold text-lg">Data Tidak Ditemukan</p>
                    <p class="text-gray-500 text-sm mt-2">Coba ubah periode tanggal untuk melihat laporan lainnya</p>
                </div>

                <!-- Table -->
                <div v-else class="overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th class="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wide">No. Laporan</th>
                                    <th class="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wide">Judul</th>
                                    <th class="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wide">Kategori</th>
                                    <th class="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wide">Tanggal</th>
                                    <th class="px-6 py-4 text-left font-semibold text-gray-700 text-xs uppercase tracking-wide">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr v-for="(report) in reportList" :key="report.id" class="hover:bg-blue-50 transition-colors">
                                    <td class="px-6 py-4">
                                        <span class="font-semibold text-gray-900">{{ report.no_laporan }}</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="max-w-xs">
                                            <p class="font-medium text-gray-900 truncate">{{ report.judul }}</p>
                                            <p class="text-xs text-gray-500 mt-1">{{ report.tipe_laporan }}</p>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="text-sm text-gray-700">{{ formatCategory(report.kategori) }}</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="text-sm text-gray-600 whitespace-nowrap">{{ formatDate(report.tanggal) }}</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <SChip 
                                            :label="statusLabel(report.status)" 
                                            :tone="statusTone(report.status)"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="totalPages > 1" class="pagination-container">
                        <div class="pagination-info">
                            Menampilkan <span>{{ startIndex + 1 }}</span> hingga <span>{{ endIndex }}</span> dari <span>{{ totalData }}</span> laporan
                        </div>
                        <SPagination
                            v-model="currentPage"
                            :total-pages="totalPages"
                        />
                    </div>
                </div>
            </SCard>
        </div>

        <!-- Filter Modal -->
        <SModal 
            :visible="showFilterModal"
            title="Filter Laporan"
            @update:visible="showFilterModal = $event"
        >
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Mulai
                    </label>
                    <input 
                        v-model="filterStartDate"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p v-if="filterStartDateError" class="text-red-500 text-sm mt-1">{{ filterStartDateError }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Akhir
                    </label>
                    <input 
                        v-model="filterEndDate"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p v-if="filterEndDateError" class="text-red-500 text-sm mt-1">{{ filterEndDateError }}</p>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p class="text-sm text-blue-900">
                        <strong>Catatan:</strong> Tanggal mulai tidak boleh lebih besar dari tanggal akhir
                    </p>
                </div>
            </div>

            <template #actions>
                <SButton 
                    label="Reset" 
                    variant="secondary"
                    @click="resetFilterModal"
                />
                <SButton 
                    label="Terapkan Filter"
                    variant="primary"
                    @click="applyFilter"
                />
            </template>
        </SModal>

        <!-- Export PDF Modal -->
        <SModal 
            :visible="showExportModal"
            title="Cetak Laporan"
            @update:visible="showExportModal = $event"
        >
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Mulai
                    </label>
                    <input 
                        v-model="exportStartDate"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p v-if="exportStartDateError" class="text-red-500 text-sm mt-1">{{ exportStartDateError }}</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Akhir
                    </label>
                    <input 
                        v-model="exportEndDate"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p v-if="exportEndDateError" class="text-red-500 text-sm mt-1">{{ exportEndDateError }}</p>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p class="text-sm text-blue-900">
                        <strong>Catatan:</strong> Tanggal mulai tidak boleh lebih besar dari tanggal akhir
                    </p>
                </div>

                <div v-if="exportError" class="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p class="text-sm text-red-900">{{ exportError }}</p>
                </div>
            </div>

            <template #actions>
                <SButton 
                    label="Batal" 
                    variant="secondary"
                    @click="resetExportModal; showExportModal = false"
                />
                <SButton 
                    label="Download PDF"
                    variant="primary"
                    :is-loading="isExporting"
                    @click="handleExportClick"
                />
            </template>
        </SModal>
    </div>
</template>

<style scoped>
.stat-card {
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    transition: all 0.3s ease;
}

.stat-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.section-card {
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
    flex-wrap: wrap;
    gap: 1rem;
}

.stf-section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    letter-spacing: -0.5px;
}

.section-count {
    font-size: 0.875rem;
    color: #6b7280;
    display: block;
    margin-top: 0.5rem;
    font-weight: 500;
}

/* Table Enhancements */
table {
    background: #ffffff;
}

table thead tr {
    background: #f3f4f6;
    border-bottom: 2px solid #e5e7eb;
}

table thead th {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #374151;
    padding: 1rem 1.5rem;
    text-align: left;
}

table tbody tr {
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.15s ease;
}

table tbody tr:hover {
    background-color: #f9fafb;
}

table tbody td {
    padding: 1rem 1.5rem;
    color: #111827;
    font-size: 0.938rem;
}

table tbody td p {
    margin: 0;
}

/* Pagination Styling */
.pagination-container {
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
}

.pagination-info {
    font-size: 0.875rem;
    color: #6b7280;
}

.pagination-info span {
    font-weight: 600;
    color: #111827;
}

.table-wrapper {
    overflow-x: auto;
}

/* Filter Controls */
.filter-extras {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    display: grid;
    grid-template-columns: 1fr 1fr auto auto;
    align-items: flex-end;
    gap: 1rem;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-date-range {
    display: flex;
    align-items: flex-end;
    height: 40px;
    padding: 0 0.5rem;
}

.filter-actions {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
}

.filter-input {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 8px 12px;
    height: 40px;
    font-size: 14px;
    color: #111827;
    background: white;
    transition: border-color 0.2s;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    padding-right: 32px;
}

.filter-input:hover {
    border-color: #9ca3af;
}

.filter-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Neutral toolbar buttons to match dropdown styling */
.filter-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #d1d5db;
    background: #ffffff;
    color: #374151;
    padding: 8px 12px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    height: 40px;
    white-space: nowrap;
    transition: all 0.2s;
}

.filter-button:hover {
    border-color: #9ca3af;
    background: #f9fafb;
}

.filter-button:active {
    background: #f3f4f6;
}

/* Responsive Grid */
@media (max-width: 1024px) {
    .stat-card {
        padding: 1.25rem;
    }
    
    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
    
    table thead th {
        padding: 0.875rem 1rem;
        font-size: 0.7rem;
    }
    
    table tbody td {
        padding: 0.875rem 1rem;
        font-size: 0.875rem;
    }

    /* Tablet: 2x2 grid */
    .filter-extras {
        grid-template-columns: 1fr 1fr;
    }

    .filter-date-range {
        grid-column: 1 / -1;
        order: 4;
    }

    .filter-actions {
        grid-column: 1 / -1;
        order: 5;
        justify-content: flex-start;
    }
}

@media (max-width: 768px) {
    .stat-card {
        padding: 1rem;
    }
    
    .stf-section-title {
        font-size: 1rem;
    }
    
    .section-header {
        padding: 1.25rem;
    }
    
    .pagination-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
    
    table {
        font-size: 0.825rem;
    }
    
    table thead th {
        padding: 0.75rem 0.875rem;
        font-size: 0.65rem;
    }
    
    table tbody td {
        padding: 0.75rem 0.875rem;
    }

    /* Mobile: stack everything */
    .filter-extras {
        grid-template-columns: 1fr;
        gap: 0.75rem;
        padding: 0.75rem;
    }

    .filter-group {
        width: 100%;
    }

    .filter-input {
        width: 100%;
    }

    .filter-date-range {
        grid-column: auto;
        padding: 0.5rem 0;
        font-size: 12px;
    }

    .filter-actions {
        grid-column: auto;
        width: 100%;
        gap: 0.5rem;
    }

    .filter-button {
        flex: 1;
        font-size: 12px;
        padding: 6px 8px;
    }
}

/* Modal Responsive Styles - Override SModal defaults */
:deep(.modal-box) {
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    box-sizing: border-box;
}

:deep(.modal-body) {
    overflow-y: auto;
    max-height: calc(90vh - 200px);
    box-sizing: border-box;
}

/* Extra small phones (< 360px) */
@media (max-width: 359px) {
    :deep(.modal-box) {
        width: 85% !important;
        max-width: 250px !important;
        margin: 0 auto;
    }

    :deep(.modal-header) {
        height: auto !important;
        padding: 0.5rem 0.625rem !important;
        gap: 0.5rem !important;
    }

    :deep(.modal-header h5) {
        font-size: 0.8rem !important;
        line-height: 1.2 !important;
    }

    :deep(.modal-close) {
        right: 0.5rem !important;
        top: 0.5rem !important;
        width: 18px !important;
        height: 18px !important;
    }

    :deep(.modal-close svg) {
        width: 18px !important;
        height: 18px !important;
    }

    :deep(.modal-body) {
        padding: 0.5rem 0.625rem 0.375rem 0.625rem !important;
        gap: 0.375rem !important;
    }

    :deep(.modal-actions) {
        padding: 0.375rem 0.625rem 0.5rem 0.625rem !important;
        gap: 0.375rem !important;
        flex-wrap: wrap;
    }

    :deep(.modal-actions button) {
        padding: 6px 8px !important;
        font-size: 0.7rem !important;
    }

    :deep(.modal-body input[type="date"]) {
        font-size: 13px !important;
        min-height: 32px !important;
    }

    :deep(.modal-body label) {
        font-size: 0.7rem !important;
        margin-bottom: 2px !important;
    }

    :deep(.modal-body p) {
        font-size: 0.65rem !important;
        margin: 2px 0 !important;
    }
}

/* Small phones (360px - 480px) */
@media (min-width: 360px) and (max-width: 480px) {
    :deep(.modal-box) {
        width: 88% !important;
        max-width: 290px !important;
        margin: 0 auto;
    }

    :deep(.modal-header) {
        height: auto !important;
        padding: 0.625rem 0.75rem !important;
        gap: 0.625rem !important;
    }

    :deep(.modal-header h5) {
        font-size: 0.85rem !important;
        line-height: 1.3 !important;
    }

    :deep(.modal-close) {
        right: 0.625rem !important;
        top: 0.625rem !important;
        width: 20px !important;
        height: 20px !important;
    }

    :deep(.modal-close svg) {
        width: 20px !important;
        height: 20px !important;
    }

    :deep(.modal-body) {
        padding: 0.75rem !important;
        gap: 0.5rem !important;
    }

    :deep(.modal-actions) {
        padding: 0.5rem 0.75rem 0.625rem 0.75rem !important;
        gap: 0.5rem !important;
        flex-wrap: wrap;
    }

    :deep(.modal-actions button) {
        padding: 7px 10px !important;
        font-size: 0.75rem !important;
    }

    :deep(.modal-body input[type="date"]) {
        font-size: 14px !important;
        min-height: 36px !important;
    }

    :deep(.modal-body label) {
        font-size: 0.75rem !important;
        margin-bottom: 3px !important;
    }

    :deep(.modal-body p) {
        font-size: 0.7rem !important;
        margin: 3px 0 !important;
    }
}

/* Medium phones (481px - 640px) */
@media (min-width: 481px) and (max-width: 640px) {
    :deep(.modal-box) {
        width: 90% !important;
        max-width: 340px !important;
        margin: 0 auto;
    }

    :deep(.modal-header) {
        height: auto !important;
        padding: 0.875rem 1rem !important;
        gap: 0.75rem !important;
    }

    :deep(.modal-header h5) {
        font-size: 0.95rem !important;
        line-height: 1.4 !important;
    }

    :deep(.modal-close) {
        right: 0.75rem !important;
        top: 0.75rem !important;
        width: 22px !important;
        height: 22px !important;
    }

    :deep(.modal-close svg) {
        width: 22px !important;
        height: 22px !important;
    }

    :deep(.modal-body) {
        padding: 0.875rem 1rem 0.625rem 1rem !important;
        gap: 0.625rem !important;
    }

    :deep(.modal-actions) {
        padding: 0.625rem 1rem 0.875rem 1rem !important;
        gap: 0.625rem !important;
        flex-wrap: wrap;
    }

    :deep(.modal-actions button) {
        padding: 8px 12px !important;
        font-size: 0.8rem !important;
    }

    :deep(.modal-body input[type="date"]) {
        font-size: 15px !important;
        min-height: 38px !important;
    }

    :deep(.modal-body label) {
        font-size: 0.8rem !important;
        margin-bottom: 4px !important;
    }

    :deep(.modal-body p) {
        font-size: 0.75rem !important;
        margin: 4px 0 !important;
    }
}

/* Tablet (641px - 1023px) */
@media (min-width: 641px) and (max-width: 1023px) {
    :deep(.modal-box) {
        width: 92% !important;
        max-width: 420px !important;
        margin: 0 auto;
    }

    :deep(.modal-header) {
        height: auto !important;
        padding: 1rem 1.25rem !important;
        gap: 1rem !important;
    }

    :deep(.modal-header h5) {
        font-size: 1rem !important;
        line-height: 1.5 !important;
    }

    :deep(.modal-close) {
        right: 1rem !important;
        top: 1rem !important;
        width: 24px !important;
        height: 24px !important;
    }

    :deep(.modal-body) {
        padding: 1rem 1.25rem 0.75rem 1.25rem !important;
        gap: 0.75rem !important;
    }

    :deep(.modal-actions) {
        padding: 0.75rem 1.25rem 1rem 1.25rem !important;
        gap: 0.75rem !important;
        flex-direction: row;
        justify-content: flex-end;
    }

    :deep(.modal-actions button) {
        padding: 10px 16px !important;
        font-size: 0.85rem !important;
        flex: none !important;
        min-width: 110px !important;
    }

    :deep(.modal-body input[type="date"]) {
        font-size: 16px !important;
        min-height: 40px !important;
    }

    :deep(.modal-body label) {
        font-size: 0.85rem !important;
        margin-bottom: 6px !important;
    }

    :deep(.modal-body p) {
        font-size: 0.8rem !important;
        margin: 4px 0 !important;
    }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
    :deep(.modal-box) {
        width: 572px !important;
    }

    :deep(.modal-header) {
        height: 91px !important;
        padding: 28px 148px !important;
        gap: 71px !important;
    }

    :deep(.modal-header h5) {
        font-size: 24px !important;
        line-height: 32px !important;
    }

    :deep(.modal-close) {
        right: 32px !important;
        top: 32px !important;
        width: 24px !important;
        height: 24px !important;
    }

    :deep(.modal-body) {
        padding: 32px 32px 24px 32px !important;
        gap: 24px !important;
    }

    :deep(.modal-actions) {
        padding: 0 32px 32px 32px !important;
        gap: 29px !important;
    }

    :deep(.modal-actions button) {
        padding: 16px 20px !important;
        font-size: 16px !important;
    }
}
</style>
