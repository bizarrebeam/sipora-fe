import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

interface LaporanBullying {
    id: string
    no_laporan: string
    judul: string
    lokasi: string
    deskripsi: string
    tanggal_kejadian: string
    tanggal_laporan: string
    status: 'menunggu' | 'diproses' | 'selesai' | 'ditolak'
    anonimitas: boolean
    pengirim_username?: string
    nama_lengkap?: string
    foto_bukti?: Array<{
        id: string
        foto: string
        uploaded_at: string
    }>
    foto_pendukung?: string[]
    catatan_admin?: string
    updated_at?: string
}

interface CreateLaporanPayload {
    judul: string
    deskripsi: string
    lokasi: string
    tanggal_kejadian: string
    anonimitas: boolean
    foto_bukti?: File[]
}

export const useLaporanBullyingStore = defineStore('laporanBullying', () => {
    const laporanList = ref<LaporanBullying[]>([])
    const totalLaporan = ref(0)

    const loadingStore = useLoadingStore()

    async function fetchLaporanBullying(params: { status?: string; search?: string }) {
        loadingStore.show('Memuat laporan bullying...')
        try {
            const queryParams: string[] = []
            if (params.status && params.status !== 'semua') {
                queryParams.push(`status=${params.status}`)
            }
            if (params.search) {
                queryParams.push(`search=${encodeURIComponent(params.search)}`)
            }

            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
            const data = await apiAuthGet(`laporan-bullying/list/${queryString}`)

            // data is already unwrapped: { total: ..., laporan: [...] }
            laporanList.value = data.laporan
            totalLaporan.value = data.total
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    async function createLaporanBullying(payload: CreateLaporanPayload) {
        loadingStore.show('Menyimpan laporan bullying...')
        try {
            // Create FormData for multipart/form-data
            const formData = new FormData()
            formData.append('judul', payload.judul)
            formData.append('deskripsi', payload.deskripsi)
            formData.append('lokasi', payload.lokasi)
            formData.append('tanggal_kejadian', payload.tanggal_kejadian)
            formData.append('anonimitas', payload.anonimitas.toString())

            // Append all photo files
            if (payload.foto_bukti && payload.foto_bukti.length > 0) {
                payload.foto_bukti.forEach((file) => {
                    formData.append('foto_bukti', file)
                })
            }

            // Direct fetch for FormData upload (api.ts doesn't support FormData)
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
            const response = await fetch(`${API_BASE_URL}laporan-bullying/tambah/`, {
                method: 'POST',
                credentials: 'include',
                body: formData // Don't set Content-Type, browser will set it with boundary
            })

            const json = await response.json()
            if (!response.ok || json.status === 'error') {
                const errorMsg = json.message || 'Gagal membuat laporan'
                throw new Error(errorMsg)
            }

            return json.data
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    return { laporanList, totalLaporan, fetchLaporanBullying, createLaporanBullying }
})