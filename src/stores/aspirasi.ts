import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

interface RiwayatStatus {
    id: string
    status: string
    catatan: string | null
    diubah_oleh_nama: string
    waktu: string
}

interface FotoBukti {
    id: string
    foto: string
    uploaded_at: string
}

interface Aspirasi {
    id: string
    no_laporan: string
    judul: string
    kategori: 'sarana' | 'kurikulum' | 'layanan' | 'ekstrakulikuler' | 'kesehatan' | 'lainnya'
    deskripsi: string
    tanggal_aspirasi: string
    anonimitas: boolean
    status_ditandai: 'ditandai' | 'tidak_ditandai'
    pengirim_username?: string
    nama_lengkap?: string
    kelas_pengirim?: string
    pelapor_info?: {
        id?: string
        username?: string
        nama_lengkap: string
        kelas?: string
        role: string
    }
    foto_bukti?: FotoBukti[]
    foto_pendukung?: string[]
    updated_at?: string
    riwayat_status?: RiwayatStatus[]
}

interface CreateAspirasiPayload {
    judul: string
    deskripsi: string
    kategori: 'sarana' | 'kurikulum' | 'layanan' | 'ekstrakulikuler' | 'kesehatan' | 'lainnya'
    anonimitas: boolean
    foto_bukti?: File[]
}

interface EditAspirasiPayload {
    judul?: string
    deskripsi?: string
    kategori?: 'sarana' | 'kurikulum' | 'layanan' | 'ekstrakulikuler' | 'kesehatan' | 'lainnya'
    anonimitas?: boolean
    foto_bukti?: File[]
}

export const useAspirasiStore = defineStore('aspirasi', () => {
    const aspirasiList = ref<Aspirasi[]>([])
    const totalAspirasi = ref(0)
    const currentAspirasi = ref<Aspirasi | null>(null)
    const isLoaded = ref(false)
    const lastFetched = ref(0)

    const loadingStore = useLoadingStore()

    async function fetchAspirasi(params: { status?: string; search?: string; kategori?: string }) {
        const CACHE_TIME = 2 * 60 * 1000 // 2 minutes
        const isStale = Date.now() - lastFetched.value > CACHE_TIME

        if (!isLoaded.value || isStale) {
            loadingStore.show('Memuat aspirasi...')
        }
        try {
            const queryParams: string[] = []
            if (params.status && params.status !== 'semua') {
                // backend expects 'ditandai' query param for status filter
                queryParams.push(`ditandai=${params.status}`)
            }
            if (params.kategori && params.kategori !== 'semua') {
                queryParams.push(`kategori=${params.kategori}`)
            }
            if (params.search) {
                queryParams.push(`search=${encodeURIComponent(params.search)}`)
            }
            
            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
            const data = await apiAuthGet(`aspirasi/list/${queryString}`)
            
            aspirasiList.value = data.aspirasi
            totalAspirasi.value = data.total
            isLoaded.value = true
            lastFetched.value = Date.now()
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    async function fetchAspirasiDetail(id: string) {
        loadingStore.show('Memuat detail aspirasi...')
        try {
            const data = await apiAuthGet(`aspirasi/${id}/`)
            currentAspirasi.value = data
            return data as Aspirasi
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    async function createAspirasi(payload: CreateAspirasiPayload) {
        loadingStore.show('Menyimpan Aspirasi...')
        try {
            const formData = new FormData()
            formData.append('judul', payload.judul)
            formData.append('kategori', payload.kategori)
            formData.append('deskripsi', payload.deskripsi)
            formData.append('anonimitas', payload.anonimitas.toString())
            
            if (payload.foto_bukti && payload.foto_bukti.length > 0) {
                payload.foto_bukti.forEach((file) => {
                    formData.append('foto_bukti', file)
                })
            }
            
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
            const response = await fetch(`${API_BASE_URL}aspirasi/tambah/`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            })
            
            const json = await response.json()
            if (!response.ok || json.status === 'error') {
                const errorMsg = json.message || 'Gagal membuat aspirasi'
                throw new Error(errorMsg)
            }
            
            return json.data
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }



    return { aspirasiList, totalAspirasi, currentAspirasi, fetchAspirasi, fetchAspirasiDetail, createAspirasi }
})