import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet } from '@/services/api'

export const useDashboardBullyingStore = defineStore('dashboardBullying', () => {
    const metrics = ref({ total: 0, belum_selesai: 0, selesai: 0, diproses: 0 })
    const differences = ref({ total: 0, belum_selesai: 0, selesai: 0, diproses: 0 }) // Ganti state
    const byStatus = ref<Record<string, number>>({})
    const byJenis = ref<Record<string, number>>({})
    const topLocations = ref<Array<{label: string, count: number}>>([])
    const topClasses = ref<Array<{label: string, count: number}>>([])
    const trend = ref({ labels: [], series: [] as any[] })
    const loading = ref(false)

    async function fetchDashboard(params: Record<string, any> = {}) {
        loading.value = true
        try {
            const qs = new URLSearchParams()
            for (const k in params) {
                if (params[k] !== undefined && params[k] !== null) qs.set(k, String(params[k]))
            }

            const endpoint = `dashboard/dashboard-bullying/?${qs.toString()}`
            const data = await apiAuthGet(endpoint)
            if (data) {
                metrics.value = data.metrics || metrics.value
                differences.value = data.differences || differences.value
                byStatus.value = data.by_status || {}
                byJenis.value = data.by_jenis || {}
                topLocations.value = data.top_locations || []
                topClasses.value = data.top_classes || []
                trend.value = data.trend || { labels: [], series: [] }
            }
        } finally {
            loading.value = false
        }
    }
    return {
        metrics,
        differences,
        byStatus,
        byJenis,
        topLocations,
        topClasses,
        trend,
        loading,
        fetchDashboard,
    }
})

export const useDashboarKerusakanAspirasidStore = defineStore('dashboardKerusakanAspirasi', () => {
  const metrics = ref({ kerusakan_total: 0, kerusakan_belum_selesai: 0, aspirasi_total: 0, aspirasi_ditandai: 0 })
  const differences = ref({ total: 0, belum_selesai: 0, aspirasi_total: 0, ditandai: 0 })
  const byStatusKerusakan = ref<Record<string, number>>({})
  const kerusakanTrend = ref({ labels: [], series: [] })
  const aspirasiDistribution = ref({ categories: [], counts: [] })
  const loading = ref(false)

  async function fetchOverview(params: Record<string, any> = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams()
      for (const k in params) {
        if (params[k] !== undefined && params[k] !== null) qs.set(k, String(params[k]))
      }
      const endpoint = `dashboard/dashboard-kerusakan-aspirasi/?${qs.toString()}`
      const data = await apiAuthGet(endpoint)
      if (data) {
        metrics.value = data.metrics || metrics.value
        differences.value = data.differences || differences.value
        byStatusKerusakan.value = data.by_status_kerusakan || {}
        kerusakanTrend.value = data.kerusakan_trend || { labels: [], series: [] }
        aspirasiDistribution.value = data.aspirasi_distribution || { categories: [], counts: [] }
      }
    } finally {
      loading.value = false
    }
  }
    return {
    metrics,
    differences,
    byStatusKerusakan,
    kerusakanTrend,
    aspirasiDistribution,
    loading,
    fetchOverview,
  }
})

export const useDashboardKonsultasiStore = defineStore('dashboardKonsultasi', () => {
  const metrics = ref({ selesai: 0, menunggu_konsultasi: 0, konsultasi_terkonfirmasi: 0, slot_tersedia: 0 })
  const differences = ref({ selesai: 0, menunggu: 0, terkonfirmasi: 0, tersedia: 0 })
  const byStatus = ref<Record<string, number>>({})
  const trend = ref({ labels: [], series: [] as any[] })
  const statusDistribution = ref({ status: [], counts: [] })
  const topStudents = ref<Array<{ label: string; count: number }>>([])
  const topDays = ref<Array<{ label: string; count: number }>>([])
  const loading = ref(false)

  async function fetchKonsultasi(params: Record<string, any> = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams()
      for (const k in params) {
        if (params[k] !== undefined && params[k] !== null) qs.set(k, String(params[k]))
      }
      const endpoint = `dashboard/dashboard-konsultasi/?${qs.toString()}`
      const data = await apiAuthGet(endpoint)
      if (data) {
        metrics.value = data.metrics || metrics.value
        differences.value = data.differences || differences.value
        byStatus.value = data.by_status || {}
        trend.value = data.trend || { labels: [], series: [] }
        statusDistribution.value = data.status_distribution || { status: [], counts: [] }
        topStudents.value = data.top_students || []
        topDays.value = data.top_days || []
      }
    } finally {
      loading.value = false
    }
  }

  return {
    metrics,
    differences,
    byStatus,
    trend,
    statusDistribution,
    topStudents,
    topDays,
    loading,
    fetchKonsultasi,
  }
})