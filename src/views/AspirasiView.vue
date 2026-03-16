<script setup lang="ts">
import { ref, computed, onMounted, watch, unref } from 'vue'
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
import { useAspirasiStore } from '@/stores/aspirasi'

interface Aspirasi {
	id: string
	no_laporan: string
	judul: string
    kategori: 'sarana' | 'kurikulum' | 'layanan' | 'ekstrakulikuler' | 'kesehatan' | 'lainnya'
	deskripsi: string
	anonimitas: boolean
	status_ditandai: 'ditandai' | 'tidak_ditandai'
	pengirim_username?: string
	nama_lengkap?: string
	pelapor_info?: {
        nama_lengkap: string;
        kelas: string;
        role: string;
        id?: string;
        username?: string;
    }
	akun_terverifikasi?: boolean
	foto_bukti?: Array<{ id: string; foto: string; uploaded_at: string }>
	foto_pendukung?: string[]
}

const auth = useAuthStore()
const aspirasiStore = useAspirasiStore()
const isKemahasiswaan = computed(() => auth.user?.role === 'kemahasiswaan')
const isAdmin = computed(() => isKemahasiswaan.value)
const isPelapor = computed(() => !isAdmin.value)

const loading = ref(false)
const search = ref('')
const selectedStatus = ref('semua')
const selectedKategori = ref('semua')
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

const sortKey = ref('no_laporan')
const sortOrder = ref<'asc' | 'desc'>('desc')

const currentPage = ref(1)
const pageSize = ref(20)

const showDetailDialog = ref(false)
const selectedLaporan = ref<Aspirasi | null>(null)

const showStatusDialog = ref(false)
const statusTarget = ref<Aspirasi | null>(null)
const statusDitandai = ref<'ditandai' | 'tidak_ditandai'>('ditandai')

const statusTabs = [
	{ label: 'Semua', value: 'semua' },
    { label: 'Ditandai', value: 'ditandai' },
    { label: 'Tidak Ditandai', value: 'tidak_ditandai' },
]

const kategoriTabs = [
    { label: 'Semua', value: 'semua' },
    { label: 'Sarana & Prasarana', value: 'sarana' },
    { label: 'Kurikulum & Pembelajaran', value: 'kurikulum' },
    { label: 'Layanan Infrastruktur & Akademik', value: 'layanan' },
    { label: 'Ekstrakulikuler & Bakat', value: 'ekstrakulikuler' },
    { label: 'Kesehatan & Keamanan', value: 'kesehatan' },
    { label: 'Lainnya', value: 'lainnya' },
]

function kategoriLabel(key: string) {
	const found = kategoriTabs.find(k => k.value === key)
	return found ? found.label : key
}

const aspirasiList = computed(() => unref(aspirasiStore.aspirasiList))

const kategoriCounts = computed(() => {
    const list = aspirasiList.value || []
    const counts: Record<string, number> = { semua: list.length }
    
    kategoriTabs.forEach(tab => {
        if (tab.value !== 'semua') {
            counts[tab.value] = list.filter(l => l.kategori === tab.value).length
        }
    })
    return counts
})

const statusCounts = computed(() => {
    const list = aspirasiList.value || []
    return {
        semua: list.length,
        ditandai: list.filter(l => l.status_ditandai === 'ditandai').length,
        tidak_ditandai: list.filter(l => l.status_ditandai === 'tidak_ditandai').length
    }
})

function tabActiveClass(value: string) {
	return `tab-btn--active tab-btn--active-${value}`
}

const columns = [
	{ key: 'no_laporan', label: 'No. Laporan', sortable: true },
	{ key: 'pengirim', label: 'Pengirim', sortable: true, tdClass: 'min-w-[200px]' },
	{ key: 'judul', label: 'Judul', sortable: true },
	{ key: 'kategori', label: 'Kategori', sortable: true },
	{ key: 'status_ditandai', label: 'Ditandai', sortable: true },
	{ key: 'aksi', label: 'Aksi', sortable: false },
]

const filteredList = computed(() => {
	let list = aspirasiList.value ? [...aspirasiList.value] : []

	if (selectedKategori.value && selectedKategori.value !== 'semua') {
		list = list.filter(l => l.kategori === selectedKategori.value)
	}

	if (selectedStatus.value && selectedStatus.value !== 'semua') {
		list = list.filter(l => l.status_ditandai === selectedStatus.value)
	}

	if (selectedDate.value) {
		list = list.filter(l => {
			const d = new Date(l.tanggal_aspirasi)
			const yyyy = d.getFullYear()
			const mm = String(d.getMonth() + 1).padStart(2, '0')
			const dd = String(d.getDate()).padStart(2, '0')
			return `${yyyy}-${mm}-${dd}` === selectedDate.value
		})
	}

	if (search.value && search.value.trim()) {
		const q = search.value.toLowerCase()
		list = list.filter(l => {
			return (
				(l.no_laporan && l.no_laporan.toLowerCase().includes(q)) ||
				(l.judul && l.judul.toLowerCase().includes(q)) ||
				(l.kategori && l.kategori.toLowerCase().includes(q)) ||
				(l.deskripsi && l.deskripsi.toLowerCase().includes(q))
			)
		})
	}

	if (sortKey.value) {
		list.sort((a, b) => {
			let valA = a[sortKey.value as keyof typeof a]
			let valB = b[sortKey.value as keyof typeof b]
			
			// Handle date sorting specifically
			if (sortKey.value === 'tanggal_aspirasi') {
				const dateA = new Date(valA as string).getTime()
				const dateB = new Date(valB as string).getTime()
				return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
			}

			if (valA == null) return 1
			if (valB == null) return -1
			if (typeof valA === 'string') {
				return sortOrder.value === 'asc' ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA)
			}
			return sortOrder.value === 'asc' ? (valA as any) - (valB as any) : (valB as any) - (valA as any)
		})
	}

	return list
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
	return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusLabel(status_ditandai: string) {
	const map: Record<string, string> = {
        ditandai: 'Ditandai',
        tidak_ditandai: 'Tidak Ditandai'
	}
	return map[status_ditandai] || status_ditandai
}

function anonimitasLabel(value: boolean) {
	return value ? 'Ya' : 'Tidak'
}

function handleKategoriSelect(value: string) {
	selectedKategori.value = value
	currentPage.value = 1
}

function handleStatusSelect(value: string) {
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

function openDetail(laporan: Aspirasi) {
	selectedLaporan.value = laporan
	showDetailDialog.value = true
}

function openStatusUpdate(laporan: Aspirasi, action: 'ditandai' | 'tidak_ditandai') {
	statusTarget.value = laporan
	statusDitandai.value = action
	showStatusDialog.value = true
}

function confirmStatusUpdate() {
	if (!statusTarget.value) return
	const idx = aspirasiList.value.findIndex(l => l.id === statusTarget.value!.id)
	if (idx !== -1) {
		aspirasiList.value[idx]!.status_ditandai = statusDitandai.value
	}
	showStatusDialog.value = false
	statusTarget.value = null
}

watch([search, selectedKategori, selectedStatus, selectedDate, sortKey, sortOrder], () => {
    // No need to refetch data from API for every filter change if filtering is client-side
    // If filtering is server-side, then fetchData() should be called here.
    // For now, assuming client-side filtering based on the computed properties.
    currentPage.value = 1; // Reset page on filter/sort change
}, { immediate: false })

async function fetchData() {
    loading.value = true
    try {
        await aspirasiStore.fetchAspirasi({
            search: search.value, 
        })
    } catch (error) {
        console.error('Error fetching Aspirasi:', error)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
	fetchData()
})
</script>

<template>
	<div class="stf-page">
		<div class="stf-container">
			<div class="stf-header">
				<div class="stf-header-text">
					<h1 class="stf-page-title">Aspirasi</h1>
					<p class="stf-page-subtitle">
						{{ isAdmin ? 'Kelola dan pantau seluruh laporan aspirasi masuk dari siswa.' : 'Sampaikan ide, masukan, atau aspirasimu untuk sekolah yang lebih baik.' }}
					</p>
				</div>
				<SButton v-if="isPelapor" label="+ Buat Aspirasi" variant="primary" @click="$router.push({ name: 'createAspirasi' })" />
			</div>

			<div class="flex flex-wrap gap-2 mb-6">
					<button v-for="tab in kategoriTabs" :key="tab.value" @click="() => handleKategoriSelect(tab.value)" class="stf-tab-btn"
						:class="[
							selectedKategori === tab.value ? 'stf-tab-btn--active' : 'stf-tab-btn--inactive',
							selectedKategori === tab.value ? (tab.value === 'semua' ? 'stf-tab--semua' : 'stf-tab--sarana') : ''
						]">
					{{ tab.label }}
					<span class="stf-tab-badge"
						:class="selectedKategori === tab.value ? 'stf-tab-badge--active' : 'stf-tab-badge--inactive'">
						{{ kategoriCounts[tab.value as keyof typeof kategoriCounts] }}
					</span>
				</button>
			</div>

			<div class="flex flex-wrap gap-2 mb-6">
				<template v-if="isAdmin">
					<button v-for="tab in statusTabs" :key="tab.value" @click="() => handleStatusSelect(tab.value)" class="stf-tab-btn"
						:class="[
							selectedStatus === tab.value ? 'stf-tab-btn--active' : 'stf-tab-btn--inactive',
							selectedStatus === tab.value ? (tab.value === 'semua' ? 'stf-tab--semua' : 'stf-tab--sarana') : ''
						]">
						{{ tab.label }}
						<span class="stf-tab-badge"
							:class="selectedStatus === tab.value ? 'stf-tab-badge--active' : 'stf-tab-badge--inactive'">
							{{ statusCounts[tab.value as keyof typeof statusCounts] }}
						</span>
					</button>
				</template>
			</div>

			<div class="filters-row">
				<div class="filter-search">
					<STextField v-model="search" placeholder="Cari no. laporan, judul, kategori, deskripsi..."
						variant="text" @input="onSearchInput" />
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
					<select v-model="sortOrder" class="filter-input" @change="currentPage = 1">
						<option value="desc">Terbaru</option>
						<option value="asc">Terlama</option>
					</select>
				</div>
			</div>

			<div v-if="loading" class="loading-state">
				<p>Memuat data...</p>
			</div>

			<template v-else-if="isAdmin">
				<SCard class="section-card">
					<div class="section-header">
						<div>
							<h3 class="stf-section-title">Daftar Aspirasi</h3>
							<span class="section-count">{{ totalData }} Aspirasi ditemukan</span>
						</div>
					</div>

					<div class="table-wrapper">
						<STable :columns="columns" :data="paginatedList" :total-data="totalData"
								v-model:current-page="currentPage" v-model:page-size="pageSize" :sort-key="sortKey"
								:sort-order="sortOrder" @sort="handleSort"
								empty-message="Tidak ada aspirasi yang ditemukan.">
							<template #body-cell-id="{ row }">
								<span class="text-xs text-gray-500">{{ row.id }}</span>
							</template>

							<template #body-cell-no_laporan="{ row }">
								<span class="font-semibold text-blue-600">{{ row.no_laporan }}</span>
							</template>

							<template #body-cell-judul="{ row }">
								<span class="font-semibold">{{ row.judul }}</span>
							</template>

							<template #body-cell-kategori="{ row }">
								<SChip :label="kategoriLabel(row.kategori)" tone="info" size="small" />
							</template>

							<template #body-cell-deskripsi="{ row }">
								<div class="deskripsi-cell">{{ row.deskripsi }}</div>
							</template>

							<template #body-cell-pengirim="{ row }">
								<div class="flex flex-col items-start gap-1">
									<span class="font-semibold text-gray-800">{{ row.pelapor_info?.nama_lengkap || '-' }}</span>
									<SChip
										v-if="row.akun_terverifikasi !== undefined"
										:label="row.akun_terverifikasi ? 'Terverifikasi' : 'Belum Terverifikasi'"
										:tone="row.akun_terverifikasi ? 'success' : 'warning'"
										size="small"
									/>
								</div>
							</template>

							<template #body-cell-status_ditandai="{ row }">
								<SChip 
									:label="statusLabel(row.status_ditandai)" 
									:tone="row.status_ditandai === 'ditandai' ? 'warning' : 'neutral'" 
									size="small" 
								/>
							</template>

							<template #body-cell-aksi="{ row }">
								<div class="flex items-center gap-2">
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
								</div>
							</template>
						</STable>
					</div>
				</SCard>
			</template>

			<template v-else-if="isPelapor">
				<p class="card-view-count">{{ totalData }} Aspirasi ditemukan</p>

				<div v-if="paginatedList.length === 0" class="s-empty-state">
					<svg class="s-empty-state__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<h3 class="s-empty-state__title">Belum ada aspirasi</h3>
					<p class="s-empty-state__desc">Aspirasi yang kamu buat akan muncul di sini.</p>
				</div>

				<div v-else class="card-grid">
					<SReportCard
						v-for="item in paginatedList" 
						:key="item.id"
						:chip-label="kategoriLabel(item.kategori)"
                        chip-tone="info"
						:date="formatDate(item.tanggal_aspirasi)"
						:title="item.judul"
						:report-number="item.no_laporan"
						@click-card="$router.push({ name: 'detailAspirasi', params: { id: item.id } })"
						@click-detail="$router.push({ name: 'detailAspirasi', params: { id: item.id } })"
					/>
				</div>

				<div v-if="totalPages > 1" class="card-pagination">
					<SPagination v-model="currentPage" :total-pages="totalPages" />
				</div>
			</template>
		</div>

		<SDialog :visible="showDetailDialog" variant="primary" title="Detail Aspirasi"
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
						<span class="detail-label">Kategori</span>
						<span class="detail-value">{{ selectedLaporan.kategori }}</span>
					</div>

				<div class="detail-row">
					<span class="detail-label">Anonimitas</span>
					<span class="detail-value">{{ anonimitasLabel(selectedLaporan.anonimitas) }}</span>
				</div>
				<div v-if="isAdmin && selectedLaporan" class="detail-row">
					<span class="detail-label">Pengirim</span>
					<div class="detail-value flex items-center gap-1.5">
						<span>{{ selectedLaporan.pelapor_info?.nama_lengkap || selectedLaporan.nama_lengkap || selectedLaporan.pengirim_username || '-' }}</span>
						<span v-if="selectedLaporan.akun_terverifikasi" title="Terverifikasi" class="text-green-600">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
						</span>
					</div>
				</div>
				<div v-if="isAdmin" class="detail-row">
					<span class="detail-label">Status</span>
					<SChip size="large" variant="solid" :tone="selectedLaporan.status_ditandai === 'ditandai' ? 'warning' : 'neutral'" :label="statusLabel(selectedLaporan.status_ditandai)" />
				</div>
				<div class="detail-row detail-row--full">
					<span class="detail-label">Deskripsi Aspirasi</span>
					<p class="detail-desc">{{ selectedLaporan.deskripsi }}</p>
				</div>
			</div>

			<template #actions>
				<SButton label="Tutup" variant="secondary" @click="showDetailDialog = false" />
			</template> 
        </SDialog>
    </div>
</template>

<style scoped>
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

.aksi-btn--kategori {
	background: var(--color-blue-50);
	color: var(--color-blue-600);
}

.aksi-btn--kategori:hover {
	background: var(--color-blue-100);
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

.stat-card--kategori .stat-number {
	color: var(--color-blue-500);
}

.card-view-count {
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 500;
	font-size: 13px;
	color: var(--color-neutral-400);
	margin-bottom: 16px;
}

.card-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 16px;
}

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

.card-pagination {
	display: flex;
	justify-content: center;
	margin-top: 24px;
}

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
</style>