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

            return data
        } catch (error: any) {
            console.error('Gagal mengirim evaluasi:', error.message)
            throw error
        } finally {
            loader.hide()
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
        isLoaded,
        fetchDaftarGuru,
        fetchDaftarIndikator,
        submitEvaluasi,
        reset
    }
})
