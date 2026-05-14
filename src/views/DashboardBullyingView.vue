<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch, unref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SDropDown from '@/components/SDropDown.vue'
import SMetricsDashboard from '@/components/SMetricsDashboard.vue'
import SBarChart from '@/components/SBarChart.vue'
import SPieChart from '@/components/SPieChart.vue'
import STopDashboard from '@/components/STopDashboard.vue'
import { useAuthStore } from '@/stores/auth'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useDashboardBullyingStore } from '@/stores/dashboard'


const auth = useAuthStore()
const isLoading = ref(true)
const isAdmin = computed(() => auth.user?.role === 'kemahasiswaan')


const dashboardStore = useDashboardBullyingStore()

// Filters
const filterPeriod = ref('week') // default: minggu ini
const filterYear = ref(new Date().getFullYear())
const filterSemester = ref((new Date().getMonth() < 6) ? 2 : 1)
const filterMonth = ref(new Date().toISOString().slice(0,7)) 
const filterStartDate = ref('')


function getWeekStartISO(d = new Date()) {
	const date = new Date(d)
	const day = date.getDay()
	const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when sunday
	const monday = new Date(date.setDate(diff))
	const yyyy = monday.getFullYear()
	const mm = String(monday.getMonth() + 1).padStart(2, '0')
	const dd = String(monday.getDate()).padStart(2, '0')
	return `${yyyy}-${mm}-${dd}`
}

const filterLabel = computed(() => {
    if (filterPeriod.value === 'semester') return 'Semester'
    if (filterPeriod.value === 'month') return 'Bulan'
    if (filterPeriod.value === 'week') return 'Minggu'
    return 'Periode'
})

// initialize defaults for week/month
filterStartDate.value = getWeekStartISO()
filterMonth.value = new Date().toISOString().slice(0,7)

function selectPeriod(period: string) {
	filterPeriod.value = period
	if (period === 'week') {
		filterStartDate.value = getWeekStartISO()
	}
	if (period === 'month') {
		// use current month by default
		filterMonth.value = new Date().toISOString().slice(0,7)
	}
	// when switching period, trigger fetch
	applyFilters()
}

function applyFilters() {
	const params: any = { period: filterPeriod.value, year: filterYear.value }
	if (filterPeriod.value === 'semester') {
		params.semester = filterSemester.value
	} else if (filterPeriod.value === 'month') {
		params.month = filterMonth.value
	} else if (filterPeriod.value === 'week') {
		params.start_date = filterStartDate.value
	}
	dashboardStore.fetchDashboard(params)
}

onMounted(() => {
	applyFilters()
})

useAutoRefresh(() => applyFilters(), {
	intervalMs: 10_000,
	refetchOnVisible: true,
})

watch([filterPeriod, filterYear, filterSemester, filterMonth, filterStartDate], () => {
	applyFilters()
})
</script>

<template v-if="isAdmin">
	<div class="stf-page">
		<div class="stf-container">
			<div class="stf-header">
				<div class="stf-header-text">
					<h1 class="stf-page-title">Dashboard Bullying</h1>
					<p class="stf-page-subtitle"> Kelola dan pantau seluruh laporan bullying terkini di tahun ajaran Semester {{ auth.user?.semester }} {{ auth.user?.tahun_ajaran }}.</p>
				</div>
			</div>

			<!-- Filters -->
			<div class=" mb-6 flex justify-end items- gap-3">
				<button type="button" @click="selectPeriod('week')" :class="filterPeriod === 'week' ? 'tab-btn tab-btn--active tab-btn--active-semua' : 'tab-btn tab-btn--inactive'">Minggu Ini</button>
				<button type="button" @click="selectPeriod('month')" :class="filterPeriod === 'month' ? 'tab-btn tab-btn--active tab-btn--active-sarana' : 'tab-btn tab-btn--inactive'">Bulan Ini</button>
				<button type="button" @click="selectPeriod('semester')" :class="filterPeriod === 'semester' ? 'tab-btn tab-btn--active tab-btn--active-kurikulum' : 'tab-btn tab-btn--inactive'">Semester</button>
			</div>

            <!-- Metrics Row -->
			<div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
				<SMetricsDashboard title="Total Laporan" :value="dashboardStore.metrics.total" :difference="dashboardStore.differences.total" :filter="filterLabel" variant="total" />
				<SMetricsDashboard title="Menunggu Konfirmasi" :value="dashboardStore.metrics.belum_selesai" :difference="dashboardStore.differences.belum_selesai" :filter="filterLabel" variant="menunggu" />
				<SMetricsDashboard title="Selesai" :value="dashboardStore.metrics.selesai" :difference="dashboardStore.differences.selesai" :filter="filterLabel" variant="selesai" />
				<SMetricsDashboard title="Sedang Diproses" :value="dashboardStore.metrics.diproses" :difference="dashboardStore.differences.diproses" :filter="filterLabel" variant="diproses" />
			</div>

			<div v-if="!dashboardStore.loading" class="w-full">
				<div class="flex gap-6 items-start">
					<div class="flex-1">
						<SBarChart title="Distribusi Laporan Bullying" :filterName="filterLabel" :categories="dashboardStore.trend.labels":series="dashboardStore.trend.series"/>
					</div>
					<div  class=" mt-6">
						<SPieChart 
							title="Jenis Bullying Terbanyak" subtitle="Jumlah laporan per jenis" :items="dashboardStore.byJenis"/>
					</div>
				</div>
			</div>
			
			<!-- Top lists: lokasi dan kelas -->
			<div v-if="!dashboardStore.loading" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
				<STopDashboard title="Top Lokasi Bullying" :items="dashboardStore.topLocations" note="Lokasi dengan laporan terbanyak" />
				<STopDashboard title="Top Kelas Pelapor" :items="dashboardStore.topClasses" note="Kelas dengan laporan terbanyak"  />
			</div>
        </div>
    </div>
</template>

<<style scoped>
/* ─── Filter Tabs ─── */
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

.tab-btn--active-sarana {
    background: var(--color-blue-100);
    color: var(--color-blue-600);
    border: 1px solid var(--color-blue-400);
    box-shadow: 0 2px 8px rgba(156, 163, 175, 0.18);
}

.tab-btn--active-kurikulum {
    background: var(--color-blue-100);
    color: var(--color-blue-600);
    border: 1px solid var(--color-blue-400);
    box-shadow: 0 2px 8px rgba(156, 163, 175, 0.18);
}

.tab-btn--inactive {
    background: white;
    color: var(--color-neutral-500);
    border: 1px solid var(--color-general-border);
}

.tab-btn--inactive:hover {
    background: var(--color-neutral-50);
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
    .tab-btn {
        font-size: 12px;
        padding: 6px 12px;
    }
}
</style>