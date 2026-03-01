<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import STextField from '@/components/STextField.vue'
import STable from '@/components/STable.vue'
import SDialog from '@/components/SDialog.vue'
import SPagination from '@/components/SPagination.vue'
import { useAuthStore } from '@/stores/auth'
import { useLaporanKerusakanStore } from '@/stores/laporanKerusakan'

interface LaporanKerusakan {
	id: string
	no_laporan: string
	judul: string
	lokasi: string
	deskripsi: string
	tanggal_kejadian: string
	anonimitas: boolean
	pengirim_username?: string
	nama_lengkap?: string
	status: 'menunggu' | 'diproses' | 'selesai' | 'ditolak'
	foto_bukti?: Array<{ id: string; foto: string; uploaded_at: string }>
	foto_pendukung?: string[]
	catatan_admin?: string
}

const auth = useAuthStore()
const laporanStore = useLaporanKerusakanStore()
const isKemahasiswaan = computed(() => auth.user?.role === 'kemahasiswaan')
const isAdmin = computed(() => isKemahasiswaan.value)
const isPelapor = computed(() => !isAdmin.value)

const loading = ref(false)
const search = ref('')
const selectedStatus = ref('semua')
const selectedDate = ref('')

const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('desc')

const currentPage = ref(1)
const pageSize = ref(20)

const showDetailDialog = ref(false)
const selectedLaporan = ref<LaporanKerusakan | null>(null)

const showStatusDialog = ref(false)
const statusTarget = ref<LaporanKerusakan | null>(null)
const statusAction = ref<'diproses' | 'selesai' | 'ditolak'>('diproses')

const statusTabs = [
	{ label: 'Semua', value: 'semua' },
	{ label: 'Menunggu Konfirmasi', value: 'menunggu' },
	{ label: 'Diproses', value: 'diproses' },
	{ label: 'Selesai', value: 'selesai' },
	{ label: 'Ditolak', value: 'ditolak' },
]

function tabActiveClass(value: string) {
	return `tab-btn--active tab-btn--active-${value}`
}

const columns = [
	{ key: 'id', label: 'ID Internal', sortable: false },
	{ key: 'no_laporan', label: 'No. Laporan', sortable: true },
	{ key: 'judul', label: 'Judul Laporan', sortable: true },
	{ key: 'lokasi', label: 'Lokasi', sortable: true },
	{ key: 'deskripsi', label: 'Deskripsi Kerusakan', sortable: false },
	{ key: 'tanggal_kejadian', label: 'Tanggal Kejadian', sortable: true },
	{ key: 'pengirim', label: 'Pengirim', sortable: true },
	{ key: 'status', label: 'Status', sortable: true },
	{ key: 'aksi', label: 'Aksi', sortable: false },
]

const laporanList = computed(() => laporanStore.laporanList)
const filteredList = computed(() => {
	let list = laporanList.value

	if (selectedDate.value) {
		list = list.filter(item => {
			const itemDate = new Date(item.tanggal_kejadian).toISOString().slice(0, 10)
			return itemDate === selectedDate.value
		})
	}

	return list
})

const sortedList = computed(() => {
	if (!sortKey.value) return filteredList.value

	return [...filteredList.value].sort((a: any, b: any) => {
		let valA = a[sortKey.value]
		let valB = b[sortKey.value]
		if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
		if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
		return 0
	})
})

const totalData = computed(() => filteredList.value.length)
const totalPages = computed(() => Math.ceil(totalData.value / pageSize.value))
const paginatedList = computed(() => {
	const start = (currentPage.value - 1) * pageSize.value
	return sortedList.value.slice(start, start + pageSize.value)
})

function formatDate(dateStr: string) {
	if (!dateStr) return '-'
	const d = new Date(dateStr)
	return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusLabel(status: string) {
	const map: Record<string, string> = {
		menunggu: 'Menunggu Konfirmasi',
		diproses: 'Diproses',
		selesai: 'Selesai',
		ditolak: 'Ditolak',
	}
	return map[status] || status
}

function anonimitasLabel(value: boolean) {
	return value ? 'Ya' : 'Tidak'
}



function handleTabChange(value: string) {
	selectedStatus.value = value
	currentPage.value = 1
}

function handleDateChange(e: Event) {
	selectedDate.value = (e.target as HTMLInputElement).value
	currentPage.value = 1
}

function handleSort(key: string) {
	if (sortKey.value === key) {
		sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
	} else {
		sortKey.value = key
		sortOrder.value = 'asc'
	}
}

let searchTimeout: ReturnType<typeof setTimeout>
function onSearchInput() {
	clearTimeout(searchTimeout)
	searchTimeout = setTimeout(() => {
		currentPage.value = 1
	}, 400)
}

function openDetail(laporan: LaporanKerusakan) {
	selectedLaporan.value = laporan
	showDetailDialog.value = true
}

function openStatusUpdate(laporan: LaporanKerusakan, action: 'diproses' | 'selesai' | 'ditolak') {
	statusTarget.value = laporan
	statusAction.value = action
	showStatusDialog.value = true
}

function confirmStatusUpdate() {
	if (!statusTarget.value) return
	const idx = laporanList.value.findIndex(l => l.id === statusTarget.value!.id)
	if (idx !== -1) {
		laporanList.value[idx]!.status = statusAction.value
	}
	showStatusDialog.value = false
	statusTarget.value = null
}

const statusCounts = computed(() => ({
	semua: laporanList.value.length,
	menunggu: laporanList.value.filter(l => l.status === 'menunggu').length,
	diproses: laporanList.value.filter(l => l.status === 'diproses').length,
	selesai: laporanList.value.filter(l => l.status === 'selesai').length,
	ditolak: laporanList.value.filter(l => l.status === 'ditolak').length,
}))

watch([selectedStatus, search], () => {
	fetchData()
}, { immediate: false })

async function fetchData() {
	loading.value = true
	try {
		await laporanStore.fetchLaporanKerusakan({
			status: selectedStatus.value,
			search: search.value,
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
					<h1 class="laporan-title">Laporan Kerusakan</h1>
					<p class="laporan-subtitle">
						{{ isAdmin ? 'Kelola dan pantau seluruh laporan kerusakan fasilitas yang masuk dari siswa.' : 'Pantau status laporan kerusakan fasilitas yang telah kamu kirim.' }}
					</p>
				</div>
				<SButton v-if="isPelapor" label="+ Buat Laporan" variant="primary" @click="$router.push({ name: 'createLaporanKerusakan' })" />
			</div>

			<div class="flex flex-wrap gap-2 mb-6">
				<button v-for="tab in statusTabs" :key="tab.value" @click="handleTabChange(tab.value)" class="tab-btn"
					:class="selectedStatus === tab.value ? tabActiveClass(tab.value) : 'tab-btn--inactive'">
					{{ tab.label }}
					<span class="tab-badge"
						:class="selectedStatus === tab.value ? 'tab-badge--active' : 'tab-badge--inactive'">
						{{ statusCounts[tab.value as keyof typeof statusCounts] }}
					</span>
				</button>
			</div>

			<div class="flex flex-col md:flex-row gap-4 mb-6">
				<div class="flex-1">
					<STextField v-model="search" placeholder="Cari no. laporan, judul, lokasi, deskripsi..."
						variant="text" @input="onSearchInput" />
				</div>
				<div>
					<input type="date" :value="selectedDate" class="date-input" @change="handleDateChange" />
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
							v-model:current-page="currentPage" v-model:page-size="pageSize" :sort-key="sortKey"
							:sort-order="sortOrder" @sort="handleSort"
							empty-message="Tidak ada laporan kerusakan yang ditemukan.">
							<template #body-cell-id="{ row }">
								<span class="text-xs text-gray-500">{{ row.id }}</span>
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

							<template #body-cell-deskripsi="{ row }">
								<div class="deskripsi-cell">{{ row.deskripsi }}</div>
							</template>

							<template #body-cell-tanggal_kejadian="{ row }">
								<span class="text-sm text-gray-500">{{ formatDate(row.tanggal_kejadian) }}</span>
							</template>

							<template #body-cell-pengirim="{ row }">
								<span class="text-sm text-gray-500">
									{{ row.nama_lengkap || row.pengirim_username || '-' }}
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
										@click="$router.push({ name: 'detailLaporanKerusakan', params: { id: row.id } })">
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
					<p class="empty-desc">Laporan kerusakan yang kamu buat akan muncul di sini.</p>
				</div>

				<div v-else class="card-grid">
					<div v-for="item in paginatedList" :key="item.id" class="report-card" @click="$router.push({ name: 'detailLaporanKerusakan', params: { id: item.id } })">
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

						<p class="report-card__desc">{{ item.deskripsi }}</p>

						<div class="report-card__footer">
							<button class="aksi-btn aksi-btn--detail" @click.stop="$router.push({ name: 'detailLaporanKerusakan', params: { id: item.id } })">
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
		<SDialog :visible="showDetailDialog" variant="primary" title="Detail Laporan Kerusakan"
			@update:visible="showDetailDialog = $event" @close="showDetailDialog = false">
			<div v-if="selectedLaporan" class="detail-content">
				<div v-if="isAdmin" class="detail-row">
					<span class="detail-label">ID Internal</span>
					<span class="detail-value">{{ selectedLaporan.id }}</span>
				</div>
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
					<span class="detail-label">Anonimitas</span>
					<span class="detail-value">{{ anonimitasLabel(selectedLaporan.anonimitas) }}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Status</span>
					<span class="status-badge" :class="`status-badge--${selectedLaporan.status}`">
						{{ statusLabel(selectedLaporan.status) }}
					</span>
				</div>
				<div class="detail-row detail-row--full">
					<span class="detail-label">Deskripsi Kerusakan</span>
					<p class="detail-desc">{{ selectedLaporan.deskripsi }}</p>
				</div>
				<div v-if="selectedLaporan.catatan_admin" class="detail-row detail-row--full">
					<span class="detail-label">Catatan Admin</span>
					<p class="detail-desc">{{ selectedLaporan.catatan_admin }}</p>
				</div>
			</div>

			<template #actions>
				<SButton label="Tutup" variant="secondary" @click="showDetailDialog = false" />
			</template>
		</SDialog>

		<!-- Status Update Confirmation Dialog -->
		<SDialog :visible="showStatusDialog" :variant="statusAction === 'ditolak' ? 'danger' : 'primary'"
			:title="statusAction === 'diproses' ? 'Proses Laporan' : statusAction === 'selesai' ? 'Selesaikan Laporan' : 'Tolak Laporan'"
			:message="`Apakah Anda yakin ingin ${statusAction === 'diproses' ? 'memproses' : statusAction === 'selesai' ? 'menyelesaikan' : 'menolak'} laporan ${statusTarget?.no_laporan}?`"
			:confirm-label="statusAction === 'diproses' ? 'Ya, Proses' : statusAction === 'selesai' ? 'Ya, Selesaikan' : 'Ya, Tolak'"
			cancel-label="Batal" @update:visible="showStatusDialog = $event" @close="showStatusDialog = false"
			@cancel="showStatusDialog = false" @confirm="confirmStatusUpdate" />
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
	color: white;
}

.tab-btn--active-semua {
	background: var(--color-blue-600);
	border-color: var(--color-blue-600);
	box-shadow: 0 2px 8px rgba(46, 48, 148, 0.25);
}

.tab-btn--active-menunggu {
	background: #F59E0B;
	border-color: #F59E0B;
	box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
}

.tab-btn--active-diproses {
	background: var(--color-neutral-400, #9CA3AF);
	border-color: var(--color-neutral-400, #9CA3AF);
	box-shadow: 0 2px 8px rgba(156, 163, 175, 0.18);
}

.tab-btn--active-selesai {
	background: #2E7D32;
	border-color: #2E7D32;
	box-shadow: 0 2px 8px rgba(46, 125, 50, 0.25);
}

.tab-btn--active-ditolak {
	background: #DC2626;
	border-color: #DC2626;
	box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25);
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

.deskripsi-cell {
	max-width: 260px;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	line-height: 1.5;
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

.status-badge--ditolak {
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

.aksi-btn--proses {
	background: var(--color-blue-50);
	color: var(--color-blue-600);
}

.aksi-btn--proses:hover {
	background: var(--color-blue-100);
}

.aksi-btn--tolak {
	background: var(--color-red-50);
	color: #DC2626;
}

.aksi-btn--tolak:hover {
	background: #FECACA;
}

.aksi-btn--selesai {
	background: #E8F5E9;
	color: #2E7D32;
}

.aksi-btn--selesai:hover {
	background: #C8E6C9;
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

.detail-desc {
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 14px;
	color: var(--color-general-black);
	line-height: 1.6;
	margin: 0;
	background: var(--color-general-frame);
	padding: 12px 16px;
	border-radius: 8px;
	width: 100%;
}

/* Card View: Pelapor (Siswa / Guru) */

/* ── Stats Row ── */
.stats-row {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
	margin-bottom: 20px;
}

.stat-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 16px 12px;
	border-radius: 12px;
	border: 1px solid var(--color-general-border);
	background: white;
	gap: 4px;
	transition: box-shadow 0.2s;
}

.stat-card:hover {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-number {
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 800;
	font-size: 28px;
	line-height: 1.1;
}

.stat-label {
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 500;
	font-size: 12px;
	color: var(--color-neutral-500);
}

.stat-card--total .stat-number {
	color: var(--color-blue-600);
}

.stat-card--menunggu .stat-number {
	color: #F59E0B;
}

.stat-card--diproses .stat-number {
	color: var(--color-blue-500);
}

.stat-card--selesai .stat-number {
	color: #2E7D32;
}

/* ── Card View Count ── */
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
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 700;
	font-size: 18px;
	color: var(--color-general-black);
	margin-bottom: 4px;
}

.empty-desc {
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 14px;
	color: var(--color-neutral-400);
}

/* ── Card Grid ── */
.card-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 16px;
}

/* ── Report Card ── */
.report-card {
	background: white;
	border: 1px solid var(--color-general-border);
	border-radius: 16px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 12px;
	cursor: pointer;
	transition: all 0.2s;
}

.report-card:hover {
	border-color: var(--color-blue-300);
	box-shadow: 0 4px 16px rgba(46, 48, 148, 0.08);
	transform: translateY(-2px);
}

.report-card__top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}

.report-card__date {
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 12px;
	color: var(--color-neutral-400);
	white-space: nowrap;
}

.report-card__no {
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 700;
	font-size: 16px;
	color: var(--color-general-black);
	margin: 0;
}

.report-card__info {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.report-card__info-row {
	display: flex;
	align-items: center;
	gap: 6px;
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 13px;
	color: var(--color-neutral-500);
}

.info-icon {
	width: 16px;
	height: 16px;
	flex-shrink: 0;
	color: var(--color-neutral-400);
}

.report-card__desc {
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 13px;
	color: var(--color-neutral-500);
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	margin: 0;
}

.report-card__footer {
	display: flex;
	justify-content: flex-end;
	padding-top: 8px;
	border-top: 1px solid var(--color-general-border);
}

.report-card__detail-link {
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 600;
	font-size: 13px;
	color: var(--color-blue-600);
	transition: color 0.15s;
}

.report-card:hover .report-card__detail-link {
	color: var(--color-blue-500);
}

/* ── Card Pagination ── */
.card-pagination {
	display: flex;
	justify-content: center;
	margin-top: 24px;
}

/* ── Responsive ── */
@media (min-width: 480px) {
	.laporan-page {
		padding: 32px 24px;
	}

	.laporan-title {
		font-size: 28px;
	}

	.stats-row {
		grid-template-columns: repeat(4, 1fr);
	}

	.card-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (min-width: 768px) {
	.date-input {
		width: auto;
	}

	.card-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (min-width: 1024px) {
	.card-grid {
		grid-template-columns: repeat(3, 1fr);
	}
}

/* Mobile Responsive Adjustments */
@media (max-width: 768px) {
	.laporan-page {
		padding: 16px;
	}

	.laporan-title {
		font-size: 20px;
	}

	.laporan-subtitle {
		font-size: 12px;
	}

	.tab-btn {
		font-size: 12px;
		padding: 6px 12px;
	}

	.tab-badge {
		font-size: 10px;
		padding: 1px 5px;
	}

	.date-input {
		padding: 8px 12px;
		font-size: 12px;
	}

	.section-title {
		font-size: 16px;
	}

	.section-count {
		font-size: 12px;
	}

	.deskripsi-cell {
		max-width: 200px;
	}

	.status-badge {
		font-size: 10px;
		padding: 3px 8px;
	}

	.aksi-btn {
		font-size: 10px;
		padding: 3px 8px;
	}

	.detail-label {
		font-size: 12px;
	}

	.detail-value {
		font-size: 12px;
	}

	.detail-desc {
		font-size: 12px;
	}

	/* Card view mobile */
	.stat-number {
		font-size: 22px;
	}

	.stat-label {
		font-size: 11px;
	}

	.stat-card {
		padding: 12px 8px;
	}

	.report-card {
		padding: 16px;
		gap: 10px;
	}

	.report-card__no {
		font-size: 14px;
	}

	.report-card__desc {
		font-size: 12px;
	}

	.report-card__detail-link {
		font-size: 12px;
	}

	.laporan-header {
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}
}
</style>
