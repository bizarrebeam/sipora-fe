import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet } from '@/services/api'

export const useLaporanPeriodikStore = defineStore('laporanPeriodik', () => {
    const reports = ref([])
    const summary = ref({
        total_reports: 0,
        bullying_count: 0,
        kerusakan_count: 0,
        aspirasi_count: 0,
        status_distribution: {},
        kategori_distribution: {},
    })
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchLaporanPeriodik(startDate: string, endDate: string, category?: string) {
        loading.value = true
        error.value = null
        try {
            const params = new URLSearchParams()
            if (startDate) params.set('start_date', startDate)
            if (endDate) params.set('end_date', endDate)
            if (category) params.set('kategori_laporan', category)

            const endpoint = `laporan/periodik/?${params.toString()}`
            const data = await apiAuthGet(endpoint)
            if (data) {
                summary.value = data.summary || summary.value
                reports.value = data.reports || []
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch periodic reports'
            reports.value = []
        } finally {
            loading.value = false
        }
    }

    return {
        reports,
        summary,
        loading,
        error,
        fetchLaporanPeriodik,
    }
})
