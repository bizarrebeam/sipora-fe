import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthPost, apiAuthGet } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

/**
 * Pinia store untuk manajemen fitur Evaluasi Guru.
 * Mengelola state dan actions yang berinteraksi dengan backend Evaluasi.
 */
export const useEvaluasiGuruStore = defineStore('evaluasiGuru', () => {
    const loader = useLoadingStore()

    const daftarGuru = ref<any[]>([])
    const daftarIndikator = ref<any[]>([])
    const riwayatEvaluasi = ref<any[]>([])

    const rekapEvaluasi = ref<any[]>([])
    const totalRekap = ref(0)

    const isLoaded = ref({
        guru: false,
        indikator: false,
        riwayat: false
    })


    async function fetchDaftarGuru(force = false) {
        if (!force && isLoaded.value.guru) return

        try {
            const data = await apiAuthGet('evaluasi/guru/')
            daftarGuru.value = data || []
            isLoaded.value.guru = true
        } catch (error: any) {
            console.error('Gagal mengambil daftar guru:', error.message)
        }
    }

    async function fetchSemuaGuru(force = false) {
        if (!force && isLoaded.value.guru) return

        try {
            const data = await apiAuthGet('admin/daftar/')
            daftarGuru.value = data || []
            isLoaded.value.guru = true
        } catch (error: any) {
            console.error('Gagal mengambil daftar semua guru:', error.message)
        }
    }

    async function fetchDaftarIndikator() {
        if (isLoaded.value.indikator) return

        try {
            const data = await apiAuthGet('evaluasi/indikator/')
            daftarIndikator.value = data || []
            isLoaded.value.indikator = true
        } catch (error: any) {
            console.error('Gagal mengambil daftar indikator:', error.message)
        }
    }

    /**
     * Mengirimkan data evaluasi guru ke backend.
     * 
     * @param payload - Payload data evaluasi.
     * @param payload.staff_id - ID dari guru yang dievaluasi.
     * @param payload.rating - Array nilai untuk setiap indikator penilaian.
     * @param payload.komentar - (Opsional) Pesan atau masukan tertulis untuk guru. Min 20 karakter.
     * @returns Respons dari server mengenai status pengiriman evaluasi.
     */
    async function submitEvaluasi(payload: {
        staff_id: string
        rating: {
            indikator_id: number
            nilai: number
        }[]
        komentar?: string
    }) {
        loader.show('Mengirim evaluasi...')

        try {
            const data = await apiAuthPost('evaluasi/', payload)

            isLoaded.value.riwayat = false
            
            // Hapus guru yang baru saja dievaluasi dari daftarGuru agar tidak muncul lagi di dropdown
            daftarGuru.value = daftarGuru.value.filter(g => g.id !== payload.staff_id)

            return data
        } catch (error: any) {
            console.error('Gagal mengirim evaluasi:', error.message)
            throw error
        } finally {
            loader.hide()
        }
    }

    async function fetchRekapEvaluasi(params: {
        guru?: string
        tahun_ajaran?: string
        semester?: string
        page?: number
        page_size?: number
    } = {}) {
        try {
            const queryParams = new URLSearchParams()
            if (params.guru) queryParams.append('guru', params.guru)
            if (params.tahun_ajaran) queryParams.append('tahun_ajaran', params.tahun_ajaran)
            if (params.semester) queryParams.append('semester', params.semester)
            if (params.page) queryParams.append('page', params.page.toString())
            if (params.page_size) queryParams.append('page_size', params.page_size.toString())

            const url = `evaluasi/rekap/?${queryParams.toString()}`
            const data = await apiAuthGet(url)

            // DRF PageNumberPagination returns { count, next, previous, results }
            if (data && data.results) {
                rekapEvaluasi.value = data.results
                totalRekap.value = data.count
            } else {
                rekapEvaluasi.value = data || []
                totalRekap.value = data?.length || 0
            }
        } catch (error: any) {
            console.error('Gagal mengambil rekap evaluasi:', error.message)
            rekapEvaluasi.value = []
            totalRekap.value = 0
            throw error
        }
    }

    function reset() {
        daftarGuru.value = []
        daftarIndikator.value = []
        riwayatEvaluasi.value = []

        isLoaded.value = {
            guru: false,
            indikator: false,
            riwayat: false
        }
    }

    return {
        daftarGuru,
        daftarIndikator,
        riwayatEvaluasi,
        rekapEvaluasi,
        totalRekap,
        isLoaded,
        fetchDaftarGuru,
        fetchDaftarIndikator,
        submitEvaluasi,
        fetchRekapEvaluasi,
        reset
    }
})
