<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import STextField from '@/components/STextField.vue'
import STable from '@/components/STable.vue'
import SDialog from '@/components/SDialog.vue'
import SPagination from '@/components/SPagination.vue'
import { useAuthStore } from '@/stores/auth'
import { useLaporanBullyingStore } from '@/stores/laporanBullying'

const auth = useAuthStore()
const laporanStore = useLaporanBullyingStore()
const router = useRouter()
const isKemahasiswaan = computed(() => auth.user?.role === 'kemahasiswaan')
const isGuruBk = computed(() => auth.user?.role === 'guru_bk')
const isAdmin = computed(() => isKemahasiswaan.value || isGuruBk.value)
const isPelapor = computed(() => !isAdmin.value)

const loading = ref(false)
const search = ref('')
const selectedStatus = ref('semua')
const selectedDate = ref('')
const apiSort = ref<'desc' | 'asc'>('desc')

const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('desc')

const currentPage = ref(1)
const pageSize = ref(20)

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
    { key: 'no_laporan', label: 'No. Laporan', sortable: true },
    { key: 'judul', label: 'Judul Laporan', sortable: true },
    { key: 'lokasi', label: 'Lokasi', sortable: true },
    { key: 'tanggal_kejadian', label: 'Tanggal Kejadian', sortable: true },
    { key: 'nama_pengirim', label: 'Pengirim', sortable: true },
    { key: 'kelas', label: 'Kelas', sortable: true },
    { key: 'is_verified', label: 'Status Verifikasi Akun', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'aksi', label: 'Aksi', sortable: false },
]

const laporanList = computed(() => laporanStore.daftarLaporan)

const filteredList = computed(() => {
    return Array.isArray(laporanList.value) ? laporanList.value : []
})

const totalData = computed(() => filteredList.value.length)
const totalPages = computed(() => Math.ceil(totalData.value / pageSize.value))

const paginatedList = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredList.value.slice(start, start + pageSize.value)
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

let searchTimeout: ReturnType<typeof setTimeout>
function onSearchInput() {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        currentPage.value = 1
        fetchData()
    }, 400)
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
            date: selectedDate.value
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

onMounted(() => { fetchData() })
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

            <!-- ── Status Tabs (scrollable on mobile) ── -->
            <div class="tabs-wrapper">
                <div class="tabs-scroll">
                    <button
                        v-for="tab in statusTabs"
                        :key="tab.value"
                        @click="handleTabChange(tab.value)"
                        class="tab-btn"
                        :class="selectedStatus === tab.value ? 'tab-btn--active' : 'tab-btn--inactive'"
                    >
                        {{ tab.label }}
                        <span class="tab-badge" :class="selectedStatus === tab.value ? 'tab-badge--active' : 'tab-badge--inactive'">
                            {{ statusCounts[tab.value as keyof typeof statusCounts] || 0 }}
                        </span>
                    </button>
                </div>
            </div>

            <!-- ── Filters Row ── -->
            <div class="filters-row">
                <!-- Search -->
                <div class="filter-search">
                    <STextField
                        v-model="search"
                        placeholder="Cari no. laporan, judul, lokasi..."
                        variant="text"
                        @input="onSearchInput"
                    />
                </div>

                <!-- Date + Sort (hidden on mobile, shown via drawer) -->
                <div class="filter-extras">
                    <input
                        type="date"
                        :value="selectedDate"
                        class="filter-input"
                        @change="handleDateChange"
                    />
                    <select v-model="apiSort" class="filter-input" @change="handleApiSortChange">
                        <option value="desc">Terbaru</option>
                        <option value="asc">Terlama</option>
                    </select>
                </div>

                <!-- Mobile filter toggle -->
                <button class="filter-toggle-btn" @click="showFilterDrawer = true" aria-label="Filter">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                    Filter
                    <span v-if="selectedDate || apiSort !== 'desc'" class="filter-dot"></span>
                </button>
            </div>

            <!-- ── Loading ── -->
            <div v-if="loading" class="loading-state">
                <p>Memuat data...</p>
            </div>

            <!-- ══ Admin: Table View ══ -->
            <template v-else-if="isAdmin">
                <SCard class="section-card">
                    <div class="section-header">
                        <div>
                            <h3 class="stf-page-title">Daftar Laporan</h3>
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
                                <span class="cell-muted">{{ row.nama_pengirim || '-' }}</span>
                            </template>
                            <template #body-cell-kelas="{ row }">
                                <span class="cell-muted">{{ row.kelas || '-' }}</span>
                            </template>
                            <template #body-cell-is_verified="{ row }">
                                <span class="cell-muted">{{ row.is_verified ? 'Verified' : 'Not Verified' }}</span>
                            </template>
                            <template #body-cell-status="{ row }">
                                <span class="status-badge" :class="`status-badge--${row.status}`">
                                    {{ statusLabel(row.status) }}
                                </span>
                            </template>
                            <template #body-cell-aksi="{ row }">
                                <button class="aksi-btn aksi-btn--detail" @click="openDetail(row)">Detail</button>
                            </template>
                        </STable>
                    </div>
                </SCard>
            </template>

            <!-- ══ Pelapor: Card View ══ -->
            <template v-else-if="isPelapor">
                <p class="card-view-count">{{ totalData }} laporan ditemukan</p>

                <div v-if="paginatedList.length === 0" class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="stf-page-title">Belum ada laporan</p>
                    <p class="empty-desc">Laporan bullying yang kamu buat akan muncul di sini.</p>
                </div>

                <div v-else class="card-grid">
                    <div v-for="item in paginatedList" :key="item.id" class="report-card" @click="openDetail(item)">
                        <div class="report-card__top">
                            <span class="status-badge" :class="`status-badge--${item.status}`">
                                {{ statusLabel(item.status) }}
                            </span>
                            <span class="report-card__date">{{ formatDate(item.tanggal_kejadian) }}</span>
                        </div>

                        <h4 class="report-card__title">{{ item.judul }}</h4>

                        <div class="report-card__info">
                            <div class="report-card__info-row">
                                <svg xmlns="http://www.w3.org/2000/svg" class="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                <span>{{ item.lokasi }}</span>
                            </div>
                            <div class="report-card__info-row">
                                <svg xmlns="http://www.w3.org/2000/svg" class="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8M8 11h6M8 15h8M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>
                                <span>{{ item.no_laporan }}</span>
                            </div>
                        </div>

                        <div class="report-card__footer">
                            <button class="aksi-btn aksi-btn--detail aksi-btn--full" @click.stop="openDetail(item)">
                                Lihat Detail
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="totalPages > 1" class="card-pagination">
                    <SPagination v-model="currentPage" :total-pages="totalPages" />
                </div>
            </template>
        </div>

        <!-- ══ Mobile Filter Drawer ══ -->
        <Transition name="drawer-fade">
            <div v-if="showFilterDrawer" class="drawer-overlay" @click.self="showFilterDrawer = false">
                <div class="drawer">
                    <div class="drawer-header">
                        <span class="stf-page-title">Filter & Urutan</span>
                        <button class="drawer-close" @click="showFilterDrawer = false" aria-label="Tutup">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    <div class="drawer-body">
                        <div class="drawer-field">
                            <label class="drawer-label">Tanggal Kejadian</label>
                            <input
                                type="date"
                                :value="selectedDate"
                                class="filter-input"
                                @change="handleDateChange"
                            />
                        </div>
                        <div class="drawer-field">
                            <label class="drawer-label">Urutan</label>
                            <select v-model="apiSort" class="filter-input">
                                <option value="desc">Terbaru</option>
                                <option value="asc">Terlama</option>
                            </select>
                        </div>
                    </div>

                    <div class="drawer-footer">
                        <button class="drawer-reset" @click="() => { selectedDate = ''; apiSort = 'desc'; }">Reset</button>
                        <button class="drawer-apply" @click="applyFiltersAndClose">Terapkan</button>
                    </div>
                </div>
            </div>
        </Transition>
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
    padding: 10px 14px;
    height: 48px;
    font-size: 14px;
    color: var(--color-general-black);
    background: white;
    transition: border-color 0.2s;
    min-width: 140px;
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

/* ─── Status badges ─── */
.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
}
.status-badge--menunggu  { background:#fff8e1; color:#f59e0b; border:1px solid #f59e0b; }
.status-badge--diproses  { background:var(--color-blue-50); color:var(--color-blue-600); border:1px solid var(--color-blue-400); }
.status-badge--selesai   { background:#e8f5e9; color:#2e7d32; border:1px solid #2e7d32; }
.status-badge--dibatalkan{ background:var(--color-red-50); color:#dc2626; border:1px solid #dc2626; }

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

/* ─── Empty state ─── */
.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; text-align:center; }
.empty-icon  { width:56px; height:56px; color:var(--color-neutral-300); margin-bottom:16px; }
.empty-title { font-weight:700; font-size:17px; color:var(--color-general-black); margin:0 0 8px; }
.empty-desc  { font-size:13px; color:var(--color-neutral-500); margin:0; }

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

/* Drawer animation */
.drawer-fade-enter-active { transition: opacity 0.2s ease; }
.drawer-fade-leave-active { transition: opacity 0.2s ease; }
.drawer-fade-enter-from,
.drawer-fade-leave-to    { opacity: 0; }
.drawer-fade-enter-active .drawer,
.drawer-fade-leave-active .drawer { transition: transform 0.25s ease; }
.drawer-fade-enter-from .drawer,
.drawer-fade-leave-to .drawer    { transform: translateY(100%); }

/* ════════════════════════════════════════════
   RESPONSIVE
   ════════════════════════════════════════════ */

/* ── Tablet (601px – 900px) ── */
@media (min-width: 601px) and (max-width: 900px) {
    .laporan-page { padding: 20px 16px; }
    .laporan-title { font-size: 20px; }
    .card-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .filter-input { min-width: 120px; }
}

/* ── Mobile (≤ 600px) ── */
@media (max-width: 600px) {
    /* Shell */
    .stf-page {
        padding: 0 0 env(safe-area-inset-bottom, 24px);
        background: var(--color-general-frame);
    }
    .laporan-container { padding: 0; }

    /* Header */
    .laporan-header {
        background: white;
        padding: 16px;
        margin-bottom: 0;
        border-bottom: 1px solid #f3f4f6;
        gap: 10px;
    }

    /* Tabs: full-bleed scroll */
    .tabs-wrapper {
        background: white;
        padding: 0;
        border-bottom: 1px solid #f3f4f6;
        -webkit-mask-image: none;
        mask-image: none;
    }
    .tabs-scroll { padding: 10px 16px 10px; gap: 6px; }
    .tab-btn { font-size: 12px; padding: 6px 12px; }
    .tab-badge { font-size: 9px; }

    /* Filters */
    .filters-row {
        padding: 12px 16px;
        background: white;
        border-bottom: 1px solid #f3f4f6;
        margin-bottom: 0;
        gap: 8px;
    }
    .filter-extras { display: none; } /* hidden — use drawer instead */
    .filter-toggle-btn { display: inline-flex; }

    /* Admin table: horizontal scroll */
    .section-card { border-radius: 0; box-shadow: none; margin: 0; }
    .section-title { font-size: 15px; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }

    /* Card grid: single column */
    .card-grid {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 12px 16px;
        margin-bottom: 0;
    }
    .report-card {
        border-radius: 12px;
        padding: 14px;
        gap: 8px;
    }
    .report-card:hover { transform: none; }
    .report-card__title { font-size: 14px; }
    .report-card__date  { font-size: 10px; }
    .status-badge { font-size: 10px; padding: 3px 10px; }

    /* Empty state */
    .empty-state { padding: 40px 16px; }
    .empty-title { font-size: 15px; }
    .empty-desc  { font-size: 12px; }

    /* Pagination */
    .card-pagination { margin-top: 16px; padding-bottom: 16px; }

    .card-view-count { padding: 10px 16px 0; margin-bottom: 0; }
}

/* ── Very small (≤ 360px) ── */
@media (max-width: 360px) {
    .laporan-title { font-size: 15px; }
    .tab-btn { font-size: 11px; padding: 5px 10px; }
    .report-card { padding: 12px; }
    .report-card__title { font-size: 13px; }
}
</style>