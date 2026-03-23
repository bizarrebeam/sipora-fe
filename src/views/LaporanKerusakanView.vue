<script setup lang="ts">
import { ref, computed, onMounted, watch, onActivated } from 'vue'
import { useRouter } from 'vue-router'
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
import { useLaporanKerusakanStore } from '@/stores/laporanKerusakan'

interface LaporanKerusakan {
	id: string
	tanggal_laporan?: string
	created_at?: string
	no_laporan: string
	judul: string
	lokasi: string
	deskripsi: string
	tanggal_kejadian: string
	anonimitas: boolean
	pengirim_username?: string
	nama_lengkap?: string
	akun_terverifikasi?: boolean
	status: 'menunggu' | 'diproses' | 'selesai' | 'ditolak' | 'dibatalkan'
	foto_bukti?: Array<{ id: string; foto: string; uploaded_at: string }>
	foto_pendukung?: string[]
	catatan_admin?: string
}

const auth = useAuthStore()
const router = useRouter()
const laporanStore = useLaporanKerusakanStore()
const isKemahasiswaan = computed(() => auth.user?.role === 'kemahasiswaan')
const isAdmin = computed(() => isKemahasiswaan.value)
const isPelapor = computed(() => !isAdmin.value)
const canCreateLaporan = computed(() => ['siswa', 'guru'].includes(auth.user?.role || ''))
const accessDenied = computed(() => laporanStore.accessDenied)
const accessMessage = computed(() => laporanStore.accessMessage)
const pelaporEmptyDesc = computed(() => {
	if (accessDenied.value && accessMessage.value) return accessMessage.value
	return 'Laporan kerusakan yang kamu buat akan muncul di sini.'
})

const loading = ref(false)
const search = ref('')
const selectedStatus = ref('semua')
const selectedDate = ref('')
const selectedDateObj = ref<Date | null>(null)
const showDatePicker = ref(false)

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
})

const sortOrder = ref<'asc' | 'desc'>('desc')
const sortKey = ref('tanggal_laporan')
const tableSortOrder = ref<'asc' | 'desc'>('desc')

const currentPage = ref(1)
const pageSize = ref(20)

const showStatusDialog = ref(false)
const statusTarget = ref<LaporanKerusakan | null>(null)
const statusAction = ref<'diproses' | 'selesai' | 'ditolak' | 'dibatalkan'>('diproses')

const statusTabs = [
	{ label: 'Semua', value: 'semua' },
	{ label: 'Menunggu Konfirmasi', value: 'menunggu' },
	{ label: 'Diproses', value: 'diproses' },
	{ label: 'Selesai', value: 'selesai' },
	{ label: 'Ditolak', value: 'ditolak' },
	{ label: 'Dibatalkan', value: 'dibatalkan' },
]

function tabActiveClass(value: string) {
	return `tab-btn--active tab-btn--active-${value}`
}

const columns = [
	{ key: 'tanggal_laporan', label: 'Timestamp', sortable: true },
	{ key: 'pengirim', label: 'Pengirim', sortable: true, tdClass: 'min-w-[200px]' },
	{ key: 'no_laporan', label: 'No. Laporan', sortable: true },
	{ key: 'judul', label: 'Judul Laporan', sortable: true },
	{ key: 'lokasi', label: 'Lokasi', sortable: true },
	{ key: 'tanggal_kejadian', label: 'Tanggal Kejadian', sortable: true },
	{ key: 'status', label: 'Status', sortable: true },
	{ key: 'aksi', label: 'Aksi', sortable: false },
]

const laporanList = computed(() => laporanStore.laporanList)
const sortedList = computed(() => {
	const list = [...laporanList.value]
	if (!sortKey.value) return list

	return list.sort((first, second) => {
		const getValue = (row: any) => {
			if (sortKey.value === 'pengirim') {
				if (row.anonimitas) return 'anonim'
				return String(row.pelapor_info?.nama_lengkap || row.nama_lengkap || '').toLowerCase()
			}

			if (sortKey.value === 'tanggal_laporan') {
				return row.tanggal_laporan || row.created_at || ''
			}

			return row[sortKey.value] ?? ''
		}

		const firstValue = getValue(first)
		const secondValue = getValue(second)

		if (firstValue < secondValue) return tableSortOrder.value === 'asc' ? -1 : 1
		if (firstValue > secondValue) return tableSortOrder.value === 'asc' ? 1 : -1
		return 0
	})
})
const totalData = computed(() => sortedList.value.length)
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

function formatDateTime(dateStr: string) {
	if (!dateStr) return '-'
	const d = new Date(dateStr)
	return d.toLocaleString('id-ID', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	})
}

function statusLabel(status: string) {
	const map: Record<string, string> = {
		menunggu: 'Menunggu Konfirmasi',
		diproses: 'Diproses',
		selesai: 'Selesai',
		ditolak: 'Ditolak',
		dibatalkan: 'Dibatalkan',
	}
	return map[status] || status
}

function anonimitasLabel(value: boolean) {
	return value ? 'Ya' : 'Tidak'
}

function statusTone(status: string): 'warning' | 'info' | 'success' | 'danger' {
	if (status === 'menunggu') return 'warning'
	if (status === 'diproses') return 'info'
	if (status === 'selesai') return 'success'
	return 'danger'
}

function handleSort(key: string) {
	if (sortKey.value === key) {
		tableSortOrder.value = tableSortOrder.value === 'desc' ? 'asc' : 'desc'
	} else {
		sortKey.value = key
		tableSortOrder.value = 'desc'
	}
}



function handleTabChange(value: string) {
	selectedStatus.value = value
	currentPage.value = 1
}

let fetchTimeout: ReturnType<typeof setTimeout>
function debouncedFetch() {
	clearTimeout(fetchTimeout)
	fetchTimeout = setTimeout(() => {
		currentPage.value = 1
		fetchData()
	}, 400)
}

function onSearchInput() {
	// handled by watcher
}

function openStatusUpdate(laporan: LaporanKerusakan, action: 'diproses' | 'selesai' | 'ditolak' | 'dibatalkan') {
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
	dibatalkan: laporanList.value.filter(l => l.status === 'dibatalkan').length,
}))

watch([selectedStatus, selectedDate, sortOrder, search], () => {
	debouncedFetch()
}, { immediate: false })

async function fetchData() {
	loading.value = true
	try {
		await laporanStore.fetchLaporanKerusakan({
			status: selectedStatus.value,
			search: search.value.trim(),
			date: selectedDate.value || undefined,
			sort: sortOrder.value,
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

onActivated(() => {
	fetchData()
})
</script>

<template>
	<div class="stf-page">
		<div class="stf-container">
			<div class="stf-header">
				<div class="stf-header-text">
					<h1 class="stf-page-title">Laporan Kerusakan</h1>
					<p class="stf-page-subtitle">
						{{ isAdmin ? 'Kelola dan pantau seluruh laporan kerusakan fasilitas yang masuk dari siswa.' :
						'Pantau status laporan kerusakan fasilitas yang telah kamu kirim.' }}
					</p>
				</div>
				<SButton v-if="isPelapor && canCreateLaporan" label="+ Buat Laporan" variant="primary"
					@click="$router.push({ name: 'createLaporanKerusakan' })" />
			</div>

			<div v-if="accessDenied && accessMessage" class="access-denied-banner mb-4">
				{{ accessMessage }}
			</div>

			<div class="flex flex-wrap gap-2 mb-6">
				<button v-for="tab in statusTabs" :key="tab.value" @click="handleTabChange(tab.value)"
					class="stf-tab-btn" :class="[
						selectedStatus === tab.value ? 'stf-tab-btn--active' : 'stf-tab-btn--inactive',
						selectedStatus === tab.value ? `stf-tab--${tab.value}` : ''
					]">
					{{ tab.label }}
					<span class="stf-tab-badge"
						:class="selectedStatus === tab.value ? 'stf-tab-badge--active' : 'stf-tab-badge--inactive'">
						{{ statusCounts[tab.value as keyof typeof statusCounts] }}
					</span>
				</button>
			</div>

			<div class="filters-row">
				<div class="filter-search">
					<STextField v-model="search" placeholder="Cari no. laporan, judul, lokasi, deskripsi..."
						variant="text" @input="onSearchInput" />
				</div>
				<div class="filter-extras">
					<div class="relative filter-date">
						<button type="button" class="filter-input filter-date-button flex items-center gap-2 bg-white"
							@click="showDatePicker = !showDatePicker">
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
								fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
								stroke-linejoin="round">
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
								<line x1="16" y1="2" x2="16" y2="6"></line>
								<line x1="8" y1="2" x2="8" y2="6"></line>
								<line x1="3" y1="10" x2="21" y2="10"></line>
							</svg>
							{{ selectedDate || 'Pilih Tanggal' }}
						</button>
						<div v-if="showDatePicker"
							class="absolute right-0 top-13 z-50 shadow-xl border rounded-2xl overflow-hidden scale-90 origin-top-right">
							<SDatePicker v-model="selectedDateObj" />
						</div>
					</div>
					<select v-model="sortOrder" class="filter-input" @change="currentPage = 1">
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
						<STable :columns="columns" :data="paginatedList" :total-data="totalData"
							v-model:current-page="currentPage" v-model:page-size="pageSize"
							:sort-key="sortKey"
							:sort-order="tableSortOrder"
							@sort="handleSort"
							empty-message="Tidak ada laporan kerusakan yang ditemukan.">
							<template #body-cell-id="{ row }">
								<span class="text-xs text-gray-500">{{ row.id }}</span>
							</template>

							<template #body-cell-tanggal_laporan="{ row }">
								<span class="text-sm text-gray-500">{{ formatDateTime(row.tanggal_laporan || row.created_at) }}</span>
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

							<template #body-cell-pengirim="{ row }">
								<div class="flex flex-col items-start gap-1">
									<span class="font-semibold text-gray-800">{{ row.anonimitas ? 'Anonim' : (row.pelapor_info?.nama_lengkap || row.nama_lengkap || '-')
										}}</span>
									<SChip v-if="!row.anonimitas && row.akun_terverifikasi !== undefined"
										:label="row.akun_terverifikasi ? 'Terverifikasi' : 'Belum Terverifikasi'"
										:tone="row.akun_terverifikasi ? 'success' : 'warning'" size="small" />
								</div>
							</template>

							<template #body-cell-aksi="{ row }">
								<SButton label="Detail" variant="action" size="small" @click="router.push({ name: 'detailLaporanKerusakan', params: { id: row.id } })">
									<template #left-icon>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
											viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
											stroke-linecap="round" stroke-linejoin="round">
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
											<circle cx="12" cy="12" r="3"></circle>
										</svg>
									</template>
								</SButton>
							</template>

							<template #body-cell-status="{ row }">
								<SChip :label="statusLabel(row.status)"
									:tone="row.status === 'selesai' ? 'success' : (row.status === 'diproses' ? 'info' : (row.status === 'menunggu' ? 'warning' : 'danger'))"
									size="small" />
							</template>


						</STable>
					</div>
				</SCard>
			</template>

			<template v-else-if="isPelapor">
				<p class="card-view-count">{{ totalData }} laporan ditemukan</p>

				<div v-if="paginatedList.length === 0" class="s-empty-state">
					<svg class="s-empty-state__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
						stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<h3 class="s-empty-state__title">Belum ada laporan</h3>
					<p class="s-empty-state__desc">{{ pelaporEmptyDesc }}</p>
				</div>

				<div v-else class="card-grid">
					<SReportCard v-for="item in paginatedList" :key="item.id"
						:status="item.status"
						:chip-label="statusLabel(item.status)"
						:chip-tone="statusTone(item.status)"
						:date="formatDate(item.tanggal_kejadian)"
						:title="item.judul"
						:location="item.lokasi"
						:report-number="item.no_laporan"
						@click-card="$router.push({ name: 'detailLaporanKerusakan', params: { id: item.id } })"
						@click-detail="$router.push({ name: 'detailLaporanKerusakan', params: { id: item.id } })" />
				</div>

				<div v-if="totalPages > 1" class="card-pagination">
					<SPagination v-model="currentPage" :total-pages="totalPages" />
				</div>
			</template>
		</div>

		<SDialog :visible="showStatusDialog" :variant="statusAction === 'ditolak' ? 'danger' : 'primary'"
			:title="statusAction === 'diproses' ? 'Proses Laporan' : statusAction === 'selesai' ? 'Selesaikan Laporan' : 'Tolak Laporan'"
			:message="`Apakah Anda yakin ingin ${statusAction === 'diproses' ? 'memproses' : statusAction === 'selesai' ? 'menyelesaikan' : 'menolak'} laporan ${statusTarget?.no_laporan}?`"
			:confirm-label="statusAction === 'diproses' ? 'Ya, Proses' : statusAction === 'selesai' ? 'Ya, Selesaikan' : 'Ya, Tolak'"
			cancel-label="Batal" @update:visible="showStatusDialog = $event" @close="showStatusDialog = false"
			@cancel="showStatusDialog = false" @confirm="confirmStatusUpdate" />
	</div>
</template>

<style scoped>
.access-denied-banner {
	padding: 12px 16px;
	border-radius: 12px;
	border: 1px solid var(--color-red-200);
	background: var(--color-red-50);
	color: var(--color-red-700);
	font-size: 14px;
	font-weight: 500;
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

/* Status badges removed */

.status-badge--dibatalkan {
	background: #FEF2F2;
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

.aksi-btn--dibatalkan {
	background: #FEF2F2;
	color: #DC2626;
}

.aksi-btn--dibatalkan:hover {
	background: #FECACA;
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

@media (max-width: 600px) {
	.card-grid {
		grid-template-columns: 1fr;
		gap: 8px;
		padding: 12px 16px;
		margin-bottom: 0;
	}

	.card-grid > * {
		width: 100%;
	}

	.card-grid :deep(.report-card) {
		width: 100%;
		border-radius: 12px;
		padding: 14px;
		gap: 8px;
	}

	.card-grid :deep(.report-card:hover) {
		transform: none;
	}

	.card-grid :deep(.report-card__no) {
		font-size: 14px;
	}

	.card-grid :deep(.report-card__date) {
		font-size: 10px;
	}

	.card-view-count {
		padding: 10px 16px 0;
		margin-bottom: 0;
	}

	.card-pagination {
		margin-top: 16px;
		padding-bottom: 16px;
	}
}

.filters-row {
	display: flex;
	gap: 12px;
	margin-bottom: 24px;
	align-items: stretch;
}

.filter-search {
	flex: 1;
	min-width: 0;
}

.filter-extras {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
	align-items: stretch;
}

.filter-extras > * {
	min-width: 0;
	width: 100%;
}

.filter-date {
	position: relative;
}

.filter-date-button {
	width: 100%;
	justify-content: flex-start;
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
	box-shadow: 0 0 0 3px rgba(46, 48, 148, .08);
}

@media (max-width: 768px) {
	.filters-row {
		flex-direction: column;
		align-items: stretch;
	}

	.filter-search {
		width: 100%;
	}

	.filter-extras {
		width: 100%;
	}

	.filter-input {
		width: 100%;
		min-width: 0;
	}

	.filter-date-button {
		justify-content: space-between;
	}

	.filter-date > div[class*='absolute'] {
		left: 0;
		right: 0;
	}
}

</style>