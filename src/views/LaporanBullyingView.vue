<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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

const showDetailDialog = ref(false)
const selectedLaporan = ref<any | null>(null)

const showStatusDialog = ref(false)
const statusTarget = ref<any | null>(null)
const statusAction = ref<'diproses' | 'selesai' | 'ditolak'>('diproses')

const statusTabs = [
	{ label: 'Semua', value: 'semua' },
	{ label: 'Menunggu Verifikasi', value: 'menunggu' },
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

// Data from store (backend API)
const laporanList = computed(() => laporanStore.daftarLaporan)

// Computed: date filtering, search, sorting, pagination
const filteredList = computed(() => {
    // Kita langsung kembalikan data dari API karena backend sudah menghandle filter
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
    
    // Tambahkan format jam jika string tanggal aslinya mengandung informasi waktu
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

// Removed duplicate declaration from here.
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
    // For admin/detail view we could use ambilDetail
    // For now we just show what we have or navigate to separate page
	selectedLaporan.value = laporan
	showDetailDialog.value = true
}

const statusCounts = computed(() => {
    // Sebagai catatan: Karena sekarang data di backend difilter, 
    // `laporanList` hanya akan berisi data yang sudah difilter (misalnya hanya status tertentu).
    // Idealnya count ini didapat dari API terpisah atau disertakan dalam response (misalnya { total, waiting, processing, dsb }).
    // Untuk saat ini karena belum ada update response agregasi, ini kita buat return default structure dulu untuk mencegah error linting, 
    // tapi angka ini hanya akan merepresentasikan yang ada di satu view paginated API.
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

onMounted(() => {
	fetchData()
})
</script>

<template>
	<div class="laporan-page">
		<div class="laporan-container">
			<div class="laporan-header">
				<div>
					<h1 class="laporan-title">Laporan Bullying</h1>
					<p class="laporan-subtitle">
						{{ isAdmin ? 'Kelola dan pantau seluruh laporan bullying yang masuk dari siswa.' : 'Pantau status laporan bullying yang telah kamu kirim.' }}
					</p>
				</div>
				<!-- <SButton v-if="isPelapor" label="+ Buat Laporan" variant="primary" @click="$router.push({ name: 'createLaporanBullying' })" /> -->
			</div>

			<div class="flex flex-wrap gap-2 mb-6">
				<button v-for="tab in statusTabs" :key="tab.value" @click="handleTabChange(tab.value)" class="tab-btn"
					:class="selectedStatus === tab.value ? 'tab-btn--active' : 'tab-btn--inactive'">
					{{ tab.label }}
					<span class="tab-badge"
						:class="selectedStatus === tab.value ? 'tab-badge--active' : 'tab-badge--inactive'">
						{{ statusCounts[tab.value as keyof typeof statusCounts] || 0 }}
					</span>
				</button>
			</div>

			<div class="flex flex-col md:flex-row gap-4 mb-6">
				<div class="flex-1">
					<STextField v-model="search" placeholder="Cari no. laporan, judul, lokasi..."
						variant="text" @input="onSearchInput" />
				</div>
				<div>
					<input type="date" :value="selectedDate" class="date-input" @change="handleDateChange" />
				</div>
                <div>
					<select v-model="apiSort" class="date-input" @change="handleApiSortChange">
						<option value="desc">Terbaru</option>
						<option value="asc">Terlama</option>
					</select>
				</div>
			</div>

			<div v-if="loading" class="loading-state">
				<p>Memuat data...</p>
			</div>

			<!-- Admin: Table View -->
			<template v-else-if="isAdmin">
				<SCard class="section-card">
					<div class="section-header">
						<div>
							<h3 class="section-title">Daftar Laporan</h3>
							<span class="section-count">{{ totalData }} laporan ditemukan</span>
						</div>
					</div>

					<div class="table-wrapper">
						<STable :columns="columns" :data="paginatedList" :total-data="totalData"
							v-model:current-page="currentPage" v-model:page-size="pageSize" :sort-key="sortKey || 'tanggal_laporan'"
							:sort-order="sortOrder" @sort="handleSort"
							empty-message="Belum ada laporan bullying.">
							<template #body-cell-tanggal_laporan="{ row }">
								<span class="text-xs text-gray-500">{{ formatDate(row.tanggal_laporan) }}</span>
							</template>

							<template #body-cell-no_laporan="{ row }">
								<span class="font-semibold text-blue-600">{{ row.no_laporan }}</span>
							</template>

							<template #body-cell-judul="{ row }">
								<span class="font-semibold">{{ row.judul }}</span>
							</template>

							<template #body-cell-lokasi="{ row }">
								<span>{{ row.lokasi }}</span>
							</template>

							<template #body-cell-tanggal_kejadian="{ row }">
								<span class="text-sm text-gray-500">{{ formatDate(row.tanggal_kejadian) }}</span>
							</template>

							<template #body-cell-nama_pengirim="{ row }">
								<span class="text-sm text-gray-500">
									{{ row.nama_pengirim || '-' }}
								</span>
							</template>

							<template #body-cell-kelas="{ row }">
								<span class="text-sm text-gray-500">
									{{ row.kelas || '-' }}
								</span>
							</template>

							<template #body-cell-is_verified="{ row }">
								<span class="text-sm text-gray-500">
									{{ row.is_verified ? 'Verified' : 'Not Verified' }}
								</span>
							</template>

							<template #body-cell-status="{ row }">
								<span class="status-badge" :class="`status-badge--${row.status}`">
									{{ statusLabel(row.status) }}
								</span>
							</template>

							<template #body-cell-aksi="{ row }">
								<div class="flex items-center gap-2">
									<button class="aksi-btn aksi-btn--detail"
										@click="openDetail(row)">
										Detail
									</button>
								</div>
							</template>
						</STable>
					</div>
				</SCard>
			</template>

			<!-- Pelapor: Card View -->
			<template v-else-if="isPelapor">
				<p class="card-view-count">{{ totalData }} laporan ditemukan</p>

				<div v-if="paginatedList.length === 0" class="empty-state">
					<svg xmlns="http://www.w3.org/2000/svg" class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<p class="empty-title">Belum ada laporan</p>
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

						<h4 class="report-card__no">{{ item.judul }}</h4>

						<div class="report-card__info">
							<div class="report-card__info-row">
								<svg xmlns="http://www.w3.org/2000/svg" class="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								<span>{{ item.lokasi }}</span>
							</div>
							<div class="report-card__info-row">
								<svg xmlns="http://www.w3.org/2000/svg" class="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8M8 11h6M8 15h8M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
								</svg>
								<span>{{ item.no_laporan }}</span>
							</div>
						</div>

						<div class="report-card__footer">
							<button class="aksi-btn aksi-btn--detail" @click.stop="openDetail(item)">
								Detail
							</button>
						</div>
					</div>
				</div>

				<div v-if="totalPages > 1" class="card-pagination">
					<SPagination v-model="currentPage" :total-pages="totalPages" />
				</div>
			</template>
		</div>

		<!-- Detail Dialog -->
		<SDialog :visible="showDetailDialog" variant="primary" title="Detail Pendek Laporan Bullying"
			@update:visible="showDetailDialog = $event" @close="showDetailDialog = false">
			<div v-if="selectedLaporan" class="detail-content">
				<div class="detail-row">
					<span class="detail-label">No. Laporan</span>
					<span class="detail-value font-semibold text-blue-600">{{ selectedLaporan.no_laporan }}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Judul Laporan</span>
					<span class="detail-value">{{ selectedLaporan.judul }}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Lokasi</span>
					<span class="detail-value">{{ selectedLaporan.lokasi }}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Tanggal Kejadian</span>
					<span class="detail-value">{{ formatDate(selectedLaporan.tanggal_kejadian) }}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Status</span>
					<span class="status-badge" :class="`status-badge--${selectedLaporan.status}`">
						{{ statusLabel(selectedLaporan.status) }}
					</span>
				</div>
                <div class="detail-row mt-2">
                    <p class="text-sm text-gray-500 italic">Untuk melihat fitur memproses laporan atau pembatalan, silakan hubungkan detail ini ke view terpisah jika diperlukan.</p>
                </div>
			</div>

			<template #actions>
				<SButton label="Tutup" variant="secondary" @click="showDetailDialog = false" />
			</template>
		</SDialog>
	</div>
</template>

<style scoped>
.laporan-page {
	min-height: calc(100vh - 64px);
	background: var(--color-general-frame);
	padding: 24px 16px;
}

.laporan-container {
	max-width: 1100px;
	margin: 0 auto;
}

.laporan-title {
	font-family: var(--font-be-vietnam);
	font-weight: 700;
	font-size: 24px;
	color: var(--color-general-black);
	margin-bottom: 4px;
}

.laporan-subtitle {
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 14px;
	color: var(--color-neutral-500);
	margin-bottom: 24px;
}

.laporan-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
	margin-bottom: 0;
}

.tab-btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	border-radius: 9999px;
	font-size: 14px;
	font-weight: 600;
	font-family: "Be Vietnam Pro", sans-serif;
	transition: all 0.2s;
	white-space: nowrap;
	cursor: pointer;
	border: none;
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

.tab-btn--inactive:hover {
	background: var(--color-neutral-50);
}

.tab-badge {
	font-size: 11px;
	font-weight: 700;
	padding: 1px 7px;
	border-radius: 9999px;
	line-height: 1.4;
}

.tab-badge--active {
	background: rgba(255, 255, 255, 0.25);
	color: white;
}

.tab-badge--inactive {
	background: var(--color-neutral-100);
	color: var(--color-neutral-500);
}

.date-input {
	border: 1px solid var(--color-general-border);
	border-radius: 8px;
	padding: 10px 16px;
	height: 48px;
	font-size: 14px;
	font-family: "Be Vietnam Pro", sans-serif;
	color: var(--color-general-black);
	background: white;
	transition: border-color 0.2s;
	width: 100%;
}

.date-input:focus {
	outline: none;
	border-color: var(--color-blue-500);
	box-shadow: 0 0 0 3px rgba(46, 48, 148, 0.08);
}

.section-card {
	margin-bottom: 16px;
}

.section-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 4px;
	gap: 12px;
	flex-wrap: wrap;
}

.section-title {
	font-family: var(--font-be-vietnam);
	font-weight: 700;
	font-size: 18px;
	color: var(--color-general-black);
	margin: 0;
}

.section-count {
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 500;
	font-size: 13px;
	color: var(--color-neutral-400);
}

.loading-state {
	text-align: center;
	padding: 40px 0;
	color: var(--color-neutral-500);
	font-family: "Be Vietnam Pro", sans-serif;
}

.status-badge {
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	border-radius: 9999px;
	font-size: 12px;
	font-weight: 600;
	font-family: "Be Vietnam Pro", sans-serif;
	white-space: nowrap;
}

.status-badge--menunggu {
	background: #FFF8E1;
	color: #F59E0B;
	border: 1px solid #F59E0B;
}

.status-badge--diproses {
	background: var(--color-blue-50);
	color: var(--color-blue-600);
	border: 1px solid var(--color-blue-400);
}

.status-badge--selesai {
	background: #E8F5E9;
	color: #2E7D32;
	border: 1px solid #2E7D32;
}

.status-badge--dibatalkan {
	background: var(--color-red-50);
	color: #DC2626;
	border: 1px solid #DC2626;
}

.aksi-btn {
	padding: 4px 12px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	font-family: "Be Vietnam Pro", sans-serif;
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

.aksi-btn--detail:hover {
	background: var(--color-neutral-100);
}

.detail-content {
	display: flex;
	flex-direction: column;
	gap: 16px;
	text-align: left;
}

.detail-row {
	display: flex;
	align-items: center;
	gap: 12px;
}

.detail-row--full {
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
}

.detail-label {
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 600;
	font-size: 13px;
	color: var(--color-neutral-500);
	min-width: 130px;
	flex-shrink: 0;
}

.detail-value {
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 14px;
	color: var(--color-general-black);
}

/* ── Card Grid (Pelapor) ── */
.card-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 20px;
	margin-bottom: 24px;
}

.report-card {
	background: white;
	border-radius: 16px;
	padding: 20px;
	border: 1px solid var(--color-general-border);
	transition: all 0.2s ease;
	display: flex;
	flex-direction: column;
	gap: 12px;
	cursor: pointer;
}

.report-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 12px 24px rgba(46, 48, 148, 0.08);
	border-color: var(--color-blue-200);
}

.report-card__top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.report-card__date {
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 12px;
	color: var(--color-neutral-400);
	font-weight: 500;
}

.report-card__no {
	font-family: var(--font-be-vietnam);
	font-weight: 700;
	font-size: 16px;
	color: var(--color-general-black);
	margin: 0;
	line-height: 1.4;
}

.report-card__info {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.report-card__info-row {
	display: flex;
	align-items: center;
	gap: 8px;
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 13px;
	color: var(--color-neutral-500);
}

.info-icon {
	width: 16px;
	height: 16px;
	color: var(--color-neutral-400);
	flex-shrink: 0;
}

.report-card__footer {
	margin-top: auto;
	padding-top: 16px;
	border-top: 1px dashed var(--color-general-border);
	display: flex;
	justify-content: flex-end;
}

.card-pagination {
	display: flex;
	justify-content: center;
	margin-top: 32px;
}

.card-view-count {
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 500;
	font-size: 13px;
	color: var(--color-neutral-400);
	margin-bottom: 16px;
}

/* ── Empty State ── */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	text-align: center;
}

.empty-icon {
	width: 64px;
	height: 64px;
	color: var(--color-neutral-300);
	margin-bottom: 16px;
}

.empty-title {
	font-family: var(--font-be-vietnam);
	font-weight: 700;
	font-size: 18px;
	color: var(--color-general-black);
	margin-bottom: 8px;
}

.empty-desc {
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 14px;
	color: var(--color-neutral-500);
}
</style>
