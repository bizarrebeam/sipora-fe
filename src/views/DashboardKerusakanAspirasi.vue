<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch, unref } from 'vue'
import SMetricsDashboard from '@/components/SMetricsDashboard.vue'
import SBarChart from '@/components/SBarChart.vue'
import SPieChart from '@/components/SPieChart.vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboarKerusakanAspirasidStore } from '@/stores/dashboard'
import { useAutoRefresh } from '@/composables/useAutoRefresh'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'kemahasiswaan')

const dashboardStore = useDashboarKerusakanAspirasidStore()

const filterPeriod = ref('week') // default minggu ini
const filterYear = ref(new Date().getFullYear())
const filterSemester = ref((new Date().getMonth() < 6) ? 2 : 1)
const filterMonth = ref(new Date().toISOString().slice(0,7)) 
const filterStartDate = ref('')

const kategoriOptions = [
  { label: 'Sarana & Prasarana', value: 'sarana' },
  { label: 'Kurikulum & Pembelajaran', value: 'kurikulum' },
  { label: 'Layanan Infrastruktur & Akademik', value: 'layanan' },
  { label: 'Ekstrakulikuler & Bakat', value: 'ekstrakulikuler' },
  { label: 'Kesehatan & Keamanan', value: 'kesehatan' },
  { label: 'Lainnya', value: 'lainnya' }
]

function getWeekStartISO(d = new Date()) {
	const date = new Date(d)
	const day = date.getDay()
	const diff = date.getDate() - day + (day === 0 ? -6 : 1) 
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
const aspirasiItems = computed(() => {
  const cats = dashboardStore.aspirasiDistribution.categories || []
  const counts = dashboardStore.aspirasiDistribution.counts || []
  const kategoriMap: Record<string, string> = {}
  kategoriOptions.forEach(opt => {
    kategoriMap[opt.value] = opt.label
  })

  const obj: Record<string, number> = {}

  for (let i = 0; i < cats.length; i++) {
    const valueKey = cats[i]
    if (valueKey) {
      const label = kategoriMap[valueKey] || valueKey 
      obj[label] = counts[i] || 0
    }
  }
  return obj
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
	dashboardStore.fetchOverview(params)
}

onMounted(() => {
	applyFilters()
})

// Auto-refresh the dashboard using current filters every 10s
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
					<h1 class="stf-page-title">Dashboard Kerusakan dan Aspirasi</h1>
					<p class="stf-page-subtitle">Kelola dan pantau seluruh laporan kerusakan dan aspirasi terkini di tahun ajaran Semester {{ auth.user?.semester }} {{ auth.user?.tahun_ajaran }}.</p>
				</div>
			</div>

			<!-- Filters -->
			<div class="mt-6 mb-6 flex justify-end gap-3">
				<button type="button" @click="selectPeriod('week')" :class="filterPeriod === 'week' ? 'tab-btn tab-btn--active tab-btn--active-semua' : 'tab-btn tab-btn--inactive'">Minggu Ini</button>
				<button type="button" @click="selectPeriod('month')" :class="filterPeriod === 'month' ? 'tab-btn tab-btn--active tab-btn--active-sarana' : 'tab-btn tab-btn--inactive'">Bulan Ini</button>
				<button type="button" @click="selectPeriod('semester')" :class="filterPeriod === 'semester' ? 'tab-btn tab-btn--active tab-btn--active-kurikulum' : 'tab-btn tab-btn--inactive'">Semester</button>
			</div>

            <!-- Metrics Row -->
			<div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
				<SMetricsDashboard title="Total Laporan Kerusakan" :value="dashboardStore.metrics.kerusakan_total" :difference="dashboardStore.differences.total" :filter="filterLabel" variant="total" />
				<SMetricsDashboard title="Kerusakan Belum Selesai" :value="dashboardStore.metrics.kerusakan_belum_selesai" :difference="dashboardStore.differences.belum_selesai" :filter="filterLabel" variant="menunggu" />
				<SMetricsDashboard title="Total Aspirasi" :value="dashboardStore.metrics.aspirasi_total" :difference="dashboardStore.differences.aspirasi_total" :filter="filterLabel" variant="total" />
				<SMetricsDashboard title="Aspirasi Ditandai" :value="dashboardStore.metrics.aspirasi_ditandai" :difference="dashboardStore.differences.ditandai" :filter="filterLabel" variant="menunggu" />
			</div>

			<div v-if="!dashboardStore.loading" class="w-full">
				<div class="flex gap-6 items-start">
					<div class="flex-1">
						<SBarChart title="Distribusi Laporan Kerusakan" :filterName="filterLabel" :categories="dashboardStore.kerusakanTrend.labels" :series="dashboardStore.kerusakanTrend.series" />
					</div>
					<div class="mt-6">
						<SPieChart title="Kategori Aspirasi Terbanyak" subtitle="Jumlah aspirasi per kategori" :items="aspirasiItems" />
					</div>
				</div>
			</div>
			

        </div>
    </div>
</template>

<style scoped>
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

@media (max-width: 768px) {
    .tab-btn {
        font-size: 12px;
        padding: 6px 12px;
    }
}
</style>