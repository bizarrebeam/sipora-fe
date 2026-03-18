import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet, apiAuthPost, apiAuthPut } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

export const useLaporanBullyingStore = defineStore('laporanBullying', () => {
    const daftarLaporan = ref<any[]>([])
    const detailLaporan = ref<any | null>(null)
    const isLoaded = ref(false)
    const lastFetched = ref(0)

    const loader = useLoadingStore()

    async function ambilLaporan(params: { sortOrder?: string; status?: string; search?: string; date?: string } = {}) {
        const CACHE_TIME = 2 * 60 * 1000 // 2 minutes
        const isStale = Date.now() - lastFetched.value > CACHE_TIME
        
        // Only show global loader if not loaded yet or data is stale
        if (!isLoaded.value || isStale) {
            loader.show('Mengambil data laporan...')
        }

        try {
            const searchParams = new URLSearchParams()
            if (params.sortOrder) searchParams.append('sort', params.sortOrder)
            else searchParams.append('sort', 'desc')

            if (params.status && params.status !== 'semua') searchParams.append('status', params.status)
            if (params.search) searchParams.append('search', params.search)
            if (params.date) searchParams.append('date', params.date)

            const data = await apiAuthGet(`laporan-bullying/?${searchParams.toString()}`)
            daftarLaporan.value = data
            isLoaded.value = true
            lastFetched.value = Date.now()
        } catch (error: any) {
            console.error('Gagal mengambil laporan:', error.message)
        } finally {
            loader.hide()
        }
    }

    async function ambilDetail(id: string) {
        loader.show('Mengambil detail laporan...')

        try {
            const data = await apiAuthGet(`laporan-bullying/${id}/`)
            detailLaporan.value = data
            return data
        } catch (error: any) {
            console.error('Gagal mengambil detail:', error.message)
            throw error
        } finally {
            loader.hide()
        }
    }

    async function buatLaporan(payload: {
        judul: string
        deskripsi: string
        lokasi: string
        tanggal_kejadian: string
        jenis_bullying: string
        anonimitas: boolean
        foto_bukti?: File[]
    }) {
        loader.show('Mengirim laporan...')

        try {
            const formData = new FormData()

            formData.append('judul', payload.judul)
            formData.append('deskripsi', payload.deskripsi)
            formData.append('lokasi', payload.lokasi)
            formData.append('tanggal_kejadian', payload.tanggal_kejadian)
            formData.append('jenis_bullying', payload.jenis_bullying)
            formData.append('anonimitas', String(payload.anonimitas))

            if (payload.foto_bukti) {
                payload.foto_bukti.forEach((file) => {
                    formData.append('foto_bukti', file)
                })
            }

            const response = await fetch('/api/laporan-bullying/create/', {
                method: 'POST',
                credentials: 'include',
                body: formData
            })

            const json = await response.json()

            if (!response.ok || json.status === 'error') {
                throw new Error(json.message || 'Gagal membuat laporan')
            }

            await ambilLaporan()
            return json.data
        } catch (error: any) {
            console.error('Gagal membuat laporan:', error.message)
            throw error
        } finally {
            loader.hide()
        }
    }

    async function editLaporan(id: string, payload: any) {
        loader.show('Mengubah laporan...')

        try {
            const formData = new FormData()

            if (payload.judul) formData.append('judul', payload.judul)
            if (payload.deskripsi) formData.append('deskripsi', payload.deskripsi)
            if (payload.lokasi) formData.append('lokasi', payload.lokasi)
            if (payload.tanggal_kejadian) formData.append('tanggal_kejadian', payload.tanggal_kejadian)
            if (payload.jenis_bullying) formData.append('jenis_bullying', payload.jenis_bullying)
            if (payload.anonimitas !== undefined) formData.append('anonimitas', String(payload.anonimitas))

            if (payload.foto_bukti && payload.foto_bukti.length > 0) {
                payload.foto_bukti.forEach((file: File) => {
                    formData.append('foto_bukti', file)
                })
            }

            const response = await fetch(`/api/laporan-bullying/${id}/edit/`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            })

            const json = await response.json()

            if (!response.ok || json.status === 'error') {
                throw new Error(json.message || 'Gagal mengedit laporan')
            }

            await ambilDetail(id)
            await ambilLaporan()
        } catch (error: any) {
            console.error('Gagal mengedit laporan:', error.message)
            throw error
        } finally {
            loader.hide()
        }
    }

    async function batalkanLaporan(id: string, alasan: string) {
        loader.show('Membatalkan laporan...')

        try {
            await apiAuthPut(`laporan-bullying/${id}/cancel/`, {
                alasan_pembatalan: alasan
            })
            await ambilLaporan()
        } catch (error: any) {
            console.error('Gagal membatalkan laporan:', error.message)
            throw error
        } finally {
            loader.hide()
        }
    }

    return {
        daftarLaporan,
        detailLaporan,
        ambilLaporan,
        ambilDetail,
        buatLaporan,
        editLaporan,
        batalkanLaporan
    }
})