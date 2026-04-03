<script setup lang="ts">
import { ref, computed, onMounted, watch, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import STextField from '@/components/STextField.vue'
import STable from '@/components/STable.vue'
import SDialog from '@/components/SDialog.vue'
import SPagination from '@/components/SPagination.vue'
import SChip from '@/components/SChip.vue'
import SDatePicker from '@/components/SDatePicker.vue'
import SReportCard from '@/components/SReportCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useLaporanBullyingStore } from '@/stores/laporanBullying'

const auth = useAuthStore()
const laporanStore = useLaporanBullyingStore()
const router = useRouter()
const route = useRoute()
const isKemahasiswaan = computed(() => auth.user?.role === 'kemahasiswaan')
const isGuruBk = computed(() => auth.user?.role === 'guru_bk')
const isAdmin = computed(() => isKemahasiswaan.value || isGuruBk.value)
const isPelapor = computed(() => !isAdmin.value)

const loading = ref(false)
const showUnauthorizedDialog = ref(false)
const search = ref('')
const selectedStatus = ref('semua')
const selectedDate = ref('')
const selectedDateObj = ref<Date | null>(null)
const showDatePicker = ref(false)
const apiSort = ref<'desc' | 'asc'>('desc')

watch(selectedDateObj, (newVal) => {
  if (newVal) {
    const yyyy = newVal.getFullYear()
    const mm = String(newVal.getMonth() + 1).padStart(2, '0')
    const dd = String(newVal.getDate()).padStart(2, '0')
    selectedDate.value = `${yyyy}-${mm}-${dd}`
  } else {
    selectedDate.value = ''
  }
  currentPage.value = 1
  showDatePicker.value = false
  fetchData()
})

const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('desc')

const currentPage = ref(1)
const pageSize = ref(isAdmin.value ? 10 : 6)

const showStatusDialog = ref(false)
const statusTarget = ref<any | null>(null)
const statusAction = ref<'diproses' | 'selesai' | 'ditolak'>('diproses')

// Mobile filter drawer
const showFilterDrawer = ref(false)

const statusTabs = [
    { label: 'Semua', value: 'semua' },
    { label: 'Menunggu', value: 'menunggu' },
    { label: 'Diproses', value: 'diproses' },
    { label: 'Selesai', value: 'selesai' },
    { label: 'Dibatalkan', value: 'dibatalkan' },
]

const columns = [
    { key: 'tanggal_laporan', label: 'Timestamp', sortable: true },
    { key: 'nama_pengirim', label: 'Pengirim', sortable: true, tdClass: 'min-w-[200px]' },
    { key: 'no_laporan', label: 'No. Laporan', sortable: true },
    { key: 'judul', label: 'Judul Laporan', sortable: true },
    { key: 'lokasi', label: 'Lokasi', sortable: true },
    { key: 'tanggal_kejadian', label: 'Tanggal Kejadian', sortable: true },
    { key: 'kelas', label: 'Kelas', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'aksi', label: 'Aksi', sortable: false },
]

const laporanList = computed(() => laporanStore.daftarLaporan)

const filteredList = computed(() => {
    return Array.isArray(laporanList.value) ? laporanList.value : []
})

const totalData = computed(() => laporanStore.totalLaporan || filteredList.value.length)
const totalPages = computed(() => Math.ceil(totalData.value / pageSize.value))

const paginatedList = computed(() => {
    return filteredList.value
})

function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
    if (dateStr.includes('T') || dateStr.includes(':')) {
        options.hour = '2-digit'
        options.minute = '2-digit'
        options.second = '2-digit'
    }
    return d.toLocaleString('id-ID', options)
}

function statusLabel(status: string) {
    const map: Record<string, string> = {
        menunggu: 'Menunggu Verifikasi',
        diproses: 'Diproses',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
    }
    return map[status] || status
}

function statusTone(status: string): 'warning' | 'info' | 'success' | 'danger' {
    if (status === 'menunggu') return 'warning'
    if (status === 'diproses') return 'info'
    if (status === 'selesai') return 'success'
    return 'danger'
}

function handleTabChange(value: string) {
    selectedStatus.value = value
    currentPage.value = 1
    fetchData()
}

function handleDateChange(e: Event) {
    selectedDate.value = (e.target as HTMLInputElement).value
    currentPage.value = 1
    fetchData()
}

function handleApiSortChange() {
    currentPage.value = 1
    sortKey.value = 'tanggal_laporan'
    sortOrder.value = apiSort.value
    fetchData()
}

function handleSort(key: string) {
    if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
    } else {
        sortKey.value = key
        sortOrder.value = 'desc'
    }
    if (key === 'tanggal_laporan') {
        apiSort.value = sortOrder.value === 'desc' ? 'desc' : 'asc'
        fetchData()
    }
}

let fetchTimeout: ReturnType<typeof setTimeout>
function debouncedFetch() {
    clearTimeout(fetchTimeout)
    fetchTimeout = setTimeout(() => {
        if (currentPage.value !== 1) {
            currentPage.value = 1
        } else {
            fetchData()
        }
    }, 400)
}

watch(currentPage, async (newVal, oldVal) => {
    if (newVal !== oldVal) {
        await fetchData()
    }
})

watch(pageSize, async (newVal, oldVal) => {
    if (newVal !== oldVal) {
        if (currentPage.value !== 1) {
            currentPage.value = 1
        } else {
            await fetchData()
        }
    }
})

watch([search, selectedDate, apiSort, selectedStatus], () => {
    debouncedFetch()
})

function onSearchInput() {
    // handled by watcher
}

function openDetail(laporan: any) {
    if (laporan && laporan.id) {
        router.push({ name: 'detailLaporanBullying', params: { id: laporan.id } })
    }
}

const statusCounts = computed(() => {
    const list = Array.isArray(laporanList.value) ? laporanList.value : []
    return {
        semua: selectedStatus.value === 'semua' ? totalData.value : 0,
        menunggu: list.filter((l: any) => l.status === 'menunggu').length,
        diproses: list.filter((l: any) => l.status === 'diproses').length,
        selesai: list.filter((l: any) => l.status === 'selesai').length,
        dibatalkan: list.filter((l: any) => l.status === 'dibatalkan').length,
    }
})

async function fetchData() {
    loading.value = true
    try {
        await laporanStore.ambilLaporan({
            sortOrder: apiSort.value,
            status: selectedStatus.value,
            search: search.value,
            date: selectedDate.value,
            page: currentPage.value,
            pageSize: pageSize.value
        })
    } catch (error) {
        console.error('Error fetching laporan:', error)
    } finally {
        loading.value = false
    }
}

function applyFiltersAndClose() {
    currentPage.value = 1
    fetchData()
    showFilterDrawer.value = false
}

onMounted(() => { 
    fetchData() 
    if (route.query.unauthorized) {
        showUnauthorizedDialog.value = true
        const query = { ...route.query }
        delete query.unauthorized
        router.replace({ query })
    }
})

onActivated(() => {
    fetchData()
})
</script>

<template>
    <div class="stf-page">
        <div class="stf-container">
            <div class="stf-header">
                <div class="stf-header-text">
                    <h1 class="stf-page-title">Laporan Bullying</h1>
                    <p class="stf-page-subtitle">
                        {{ isAdmin ? 'Kelola dan pantau seluruh laporan bullying yang masuk dari siswa.' : 'Pantau status laporan bullying yang telah kamu kirim.' }}
                    </p>
                </div>
                <SButton v-if="isPelapor" label="+ Buat Laporan" variant="primary" @click="$router.push({ name: 'createLaporanBullying' })" />
            </div>

            <div class="flex flex-wrap gap-2 mb-6">
                <button
                    v-for="tab in statusTabs"
                    :key="tab.value"
                    @click="handleTabChange(tab.value)"
                    class="stf-tab-btn"
                    :class="[
                        selectedStatus === tab.value ? 'stf-tab-btn--active' : 'stf-tab-btn--inactive',
                        selectedStatus === tab.value ? `stf-tab--${tab.value}` : ''
                    ]"
                >
                    {{ tab.label }}
                    <span class="stf-tab-badge" :class="selectedStatus === tab.value ? 'stf-tab-badge--active' : 'stf-tab-badge--inactive'">
                        {{ statusCounts[tab.value as keyof typeof statusCounts] || 0 }}
                    </span>
                </button>
            </div>

            <div class="filters-row">
                <div class="filter-search">
                    <STextField
                        v-model="search"
                        placeholder="Cari no. laporan, judul, lokasi..."
                        variant="text"
                        @input="onSearchInput"
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
                            <SDatePicker @close="showDatePicker = false" v-model="selectedDateObj" />
                        </div>
                    </div>
                    <select v-model="apiSort" class="filter-input" @change="handleApiSortChange">
                        <option value="desc">Terbaru</option>
                        <option value="asc">Terlama</option>
                    </select>
                </div>
            </div>

            <div v-if="loading && paginatedList.length === 0" class="loading-state">
                <p>Memuat data...</p>
            </div>

            <template v-else-if="isAdmin">
                <SCard class="section-card">
                    <div class="section-header">
                        <div>
                            <h3 class="stf-section-title">Daftar Laporan</h3>
                            <span class="section-count">{{ totalData }} laporan ditemukan</span>
                        </div>
                    </div>

                    <div class="table-wrapper">
                        <STable
                            :columns="columns"
                            :data="paginatedList"
                            :total-data="totalData"
                            v-model:current-page="currentPage"
                            v-model:page-size="pageSize"
                            :sort-key="sortKey || 'tanggal_laporan'"
                            :sort-order="sortOrder"
                            :loading="loading"
                            @sort="handleSort"
                            empty-message="Belum ada laporan bullying."
                        >
                            <template #body-cell-tanggal_laporan="{ row }">
                                <span class="cell-muted">{{ formatDate(row.tanggal_laporan) }}</span>
                            </template>
                            <template #body-cell-no_laporan="{ row }">
                                <span class="cell-no">{{ row.no_laporan }}</span>
                            </template>
                            <template #body-cell-judul="{ row }">
                                <span class="cell-bold">{{ row.judul }}</span>
                            </template>
                            <template #body-cell-lokasi="{ row }">
                                <span>{{ row.lokasi }}</span>
                            </template>
                            <template #body-cell-tanggal_kejadian="{ row }">
                                <span class="cell-muted">{{ formatDate(row.tanggal_kejadian) }}</span>
                            </template>
                            <template #body-cell-nama_pengirim="{ row }">
								<div class="flex flex-col items-start gap-1">
									<span class="font-semibold text-gray-800">
										{{ row.nama_pengirim || '-' }}
									</span>
									<SChip
                                        v-if="row.akun_terverifikasi !== undefined"
                                        :label="row.akun_terverifikasi ? 'Terverifikasi' : 'Belum Terverifikasi'"
                                        :tone="row.akun_terverifikasi ? 'success' : 'warning'"
                                        size="small"
                                    />
								</div>
                            </template>
                            <template #body-cell-kelas="{ row }">
                                <span class="cell-muted">{{ row.kelas || '-' }}</span>
                            </template>
                            <template #body-cell-status="{ row }">
                                <SChip 
                                    :label="statusLabel(row.status)" 
                                    :tone="row.status === 'selesai' ? 'success' : (row.status === 'diproses' ? 'info' : (row.status === 'menunggu' ? 'warning' : 'danger'))" 
                                    size="small" 
                                />
                            </template>
                            <template #body-cell-aksi="{ row }">
                                <SButton 
                                    label="Detail" 
                                    variant="action" 
                                    size="small" 
                                    @click="openDetail(row)" 
                                >
                                    <template #left-icon>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    </template>
                                </SButton>
                            </template>
                        </STable>
                    </div>
                </SCard>
            </template>

            <template v-else-if="isPelapor">
                <p class="card-view-count">{{ totalData }} laporan ditemukan</p>

                <div v-if="paginatedList.length === 0" class="s-empty-state">
                    <svg class="s-empty-state__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 class="s-empty-state__title">Belum ada laporan</h3>
                    <p class="s-empty-state__desc">Laporan bullying yang kamu buat akan muncul di sini.</p>
                </div>

                <div v-else class="card-grid">
					<SReportCard
						v-for="item in paginatedList" 
						:key="item.id"
						:status="item.status"
                        :chip-label="statusLabel(item.status)"
                        :chip-tone="statusTone(item.status)"
						:date="formatDate(item.tanggal_kejadian)"
						:title="item.judul"
						:location="item.lokasi"
						:report-number="item.no_laporan"
						@click-card="openDetail(item)"
						@click-detail="openDetail(item)"
					/>
                </div>

                <div v-if="paginatedList.length > 0" class="card-pagination">
                    <SPagination v-model="currentPage" :total-pages="totalPages" />
                </div>
            </template>
        </div>

    </div>
</template>

<style scoped>
* { font-family: "Be Vietnam Pro", sans-serif; }

/* ─── Page shell ─── */

/* ─── Tabs ─── */
.tabs-wrapper {
    margin-bottom: 16px;
    /* fade edges on overflow */
    -webkit-mask-image: linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%);
    mask-image: linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%);
}
.tabs-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 0 16px 8px;
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.tabs-scroll::-webkit-scrollbar { display: none; }

.tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
    white-space: nowrap;
    cursor: pointer;
    border: none;
    flex-shrink: 0;
}
.tab-btn--active {
    background: var(--color-blue-600);
    color: white;
    box-shadow: 0 2px 8px rgba(46, 48, 148, 0.25);
}
.tab-btn--inactive {
    background: white;
    color: var(--color-neutral-500);
    border: 1px solid var(--color-general-border);
}
.tab-btn--inactive:hover { background: var(--color-neutral-50); }
.tab-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 9999px;
    line-height: 1.4;
}
.tab-badge--active { background: rgba(255,255,255,.25); color: white; }
.tab-badge--inactive { background: var(--color-neutral-100); color: var(--color-neutral-500); }

/* ─── Filters row ─── */
.filters-row {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
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
}
.filter-input:focus {
    outline: none;
    border-color: var(--color-blue-500);
    box-shadow: 0 0 0 3px rgba(46,48,148,.08);
}
.filter-toggle-btn {
    display: none; /* shown on mobile only */
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    height: 48px;
    border-radius: 8px;
    border: 1px solid var(--color-general-border);
    background: white;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-general-black);
    cursor: pointer;
    position: relative;
    white-space: nowrap;
    flex-shrink: 0;
    transition: background 0.2s;
}
.filter-toggle-btn:hover { background: var(--color-neutral-50); }
.filter-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-blue-500);
}

/* ─── Loading ─── */
.loading-state {
    text-align: center;
    padding: 40px 0;
    color: var(--color-neutral-500);
    font-size: 14px;
}

/* ─── Admin table card ─── */
.section-card { margin-bottom: 16px; }
.section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 4px;
    gap: 12px;
    flex-wrap: wrap;
}
.section-title { font-weight: 700; font-size: 18px; color: var(--color-general-black); margin: 0; }
.section-count { font-weight: 500; font-size: 13px; color: var(--color-neutral-400); }
.table-wrapper { overflow-x: auto; }

/* Table cell helpers */
.cell-muted { font-size: 12px; color: #6b7280; }
.cell-no    { font-weight: 600; color: #2563eb; font-size: 13px; }
.cell-bold  { font-weight: 600; font-size: 13px; }

/* ─── Status badges removed ─── */

/* ─── Action button ─── */
.aksi-btn {
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    white-space: nowrap;
}
.aksi-btn--detail {
    background: var(--color-neutral-50);
    color: var(--color-general-black);
    border: 1px solid var(--color-general-border);
}
.aksi-btn--detail:hover { background: var(--color-neutral-100); }
.aksi-btn--full { width: 100%; padding: 8px; text-align: center; font-size: 13px; }

/* ─── Pelapor card grid ─── */
.card-view-count { font-weight:500; font-size:13px; color:var(--color-neutral-400); margin-bottom:16px; }

.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}
.report-card {
    background: white;
    border-radius: 16px;
    padding: 18px;
    border: 1px solid var(--color-general-border);
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 10px;
    cursor: pointer;
}
.report-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(46,48,148,.08);
    border-color: var(--color-blue-200);
}
.report-card__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.report-card__date { font-size: 11px; color: var(--color-neutral-400); font-weight: 500; }
.report-card__title { font-weight:700; font-size:15px; color:var(--color-general-black); margin:0; line-height:1.4; }
.report-card__info { display:flex; flex-direction:column; gap:6px; }
.report-card__info-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--color-neutral-500);
    word-break: break-word;
}
.info-icon { width:14px; height:14px; color:var(--color-neutral-400); flex-shrink:0; }
.report-card__footer {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px dashed var(--color-general-border);
}

/* ─── Pagination ─── */
.card-pagination { display:flex; justify-content:center; margin-top:24px; }


/* ─── Mobile Filter Drawer ─── */
.drawer-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,.4);
    display: flex;
    align-items: flex-end;
}
.drawer {
    background: white;
    border-radius: 20px 20px 0 0;
    width: 100%;
    padding: 0 0 env(safe-area-inset-bottom, 16px);
    box-shadow: 0 -8px 32px rgba(0,0,0,.12);
}
.drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px 14px;
    border-bottom: 1px solid #f3f4f6;
}
.drawer-title { font-weight: 700; font-size: 16px; color: var(--color-general-black); }
.drawer-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: #f3f4f6;
    color: #6b7280;
    cursor: pointer;
}
.drawer-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
.drawer-field { display: flex; flex-direction: column; gap: 6px; }
.drawer-label { font-size: 13px; font-weight: 600; color: var(--color-neutral-500); }
.drawer-body .filter-input { width: 100%; min-width: 0; }
.drawer-footer {
    display: flex;
    gap: 10px;
    padding: 12px 20px 16px;
    border-top: 1px solid #f3f4f6;
}
.drawer-reset {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid var(--color-general-border);
    background: white;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-neutral-500);
    cursor: pointer;
}
.drawer-apply {
    flex: 2;
    padding: 12px;
    border-radius: 10px;
    border: none;
    background: var(--color-blue-600);
    color: white;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
}
.drawer-apply:hover { background: var(--color-blue-700); }

/* ── Mobile (≤ 768px) ── */
@media (max-width: 768px) {
    .stf-page {
        padding: 24px 16px;
        overflow-y: auto;
    }
    .laporan-container { padding: 0; }

    .laporan-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 20px;
    }

    .filters-row {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        margin-bottom: 24px;
    }

    .filter-search {
        width: 100%;
    }

    .filter-extras {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        width: 100%;
    }

    .filter-input {
        width: 100%;
        min-width: 0;
    }

    .article-card { min-height: auto; }
}

/* ── Very small (≤ 360px) ── */
@media (max-width: 360px) {
    .laporan-title { font-size: 15px; }
    .tab-btn { font-size: 11px; padding: 5px 10px; }
    .report-card { padding: 12px; }
    .report-card__title { font-size: 13px; }
}
</style>