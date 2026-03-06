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

interface LaporanKerusakan {
    id: string
    no_laporan: string
    judul: string
    lokasi: string
    deskripsi: string
    tanggal_kejadian: string
    tanggal_laporan: string
    status: 'menunggu' | 'diproses' | 'selesai' | 'ditolak' | 'dibatalkan'
    anonimitas: boolean
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
    catatan_admin?: string
    updated_at?: string
    riwayat_status?: RiwayatStatus[]
}

interface CreateLaporanPayload {
    judul: string
    deskripsi: string
    lokasi: string
    tanggal_kejadian: string
    anonimitas: boolean
    foto_bukti?: File[]
}

interface EditLaporanPayload {
    judul?: string
    deskripsi?: string
    lokasi?: string
    tanggal_kejadian?: string
    anonimitas?: boolean
    foto_bukti?: File[]
}

export const useLaporanKerusakanStore = defineStore('laporanKerusakan', () => {
    const laporanList = ref<LaporanKerusakan[]>([])
    const totalLaporan = ref(0)
    const currentLaporan = ref<LaporanKerusakan | null>(null)

    const loadingStore = useLoadingStore()

    async function fetchLaporanKerusakan(params: { status?: string; search?: string }) {
        loadingStore.show('Memuat laporan kerusakan...')
        try {
            const queryParams: string[] = []
            if (params.status && params.status !== 'semua') {
                queryParams.push(`status=${params.status}`)
            }
            if (params.search) {
                queryParams.push(`search=${encodeURIComponent(params.search)}`)
            }
            
            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
            const data = await apiAuthGet(`laporan-kerusakan/list/${queryString}`)
            
            laporanList.value = data.laporan
            totalLaporan.value = data.total
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    async function fetchLaporanDetail(id: string) {
        loadingStore.show('Memuat detail laporan...')
        try {
            const data = await apiAuthGet(`laporan-kerusakan/${id}/`)
            currentLaporan.value = data
            return data as LaporanKerusakan
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    async function createLaporanKerusakan(payload: CreateLaporanPayload) {
        loadingStore.show('Menyimpan laporan kerusakan...')
        try {
            const formData = new FormData()
            formData.append('judul', payload.judul)
            formData.append('deskripsi', payload.deskripsi)
            formData.append('lokasi', payload.lokasi)
            formData.append('tanggal_kejadian', payload.tanggal_kejadian)
            formData.append('anonimitas', payload.anonimitas.toString())
            
            if (payload.foto_bukti && payload.foto_bukti.length > 0) {
                payload.foto_bukti.forEach((file) => {
                    formData.append('foto_bukti', file)
                })
            }
            
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
            const response = await fetch(`${API_BASE_URL}laporan-kerusakan/tambah/`, {
                method: 'POST',
                credentials: 'include',
                body: formData
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

    async function editLaporanKerusakan(payload: EditLaporanPayload){
        loadingStore.show('Menyimpan laporan kerusakan...')
        try {
            const formData = new FormData()
            formData.append('judul', payload.judul || '')
            formData.append('deskripsi', payload.deskripsi || '')
            formData.append('lokasi', payload.lokasi || '')
            formData.append('tanggal_kejadian', payload.tanggal_kejadian || '')
            formData.append('anonimitas', String(payload.anonimitas ?? false))
            
            if (payload.foto_bukti && payload.foto_bukti.length > 0) {
                payload.foto_bukti.forEach((file) => {
                    formData.append('foto_bukti', file)
                })
            }
            
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
            const response = await fetch(`${API_BASE_URL}laporan-kerusakan/${currentLaporan.value?.id}/edit/`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            })
            
            const json = await response.json()
            if (!response.ok || json.status === 'error') {
                const errorMsg = json.message || 'Gagal memperbarui laporan'
                throw new Error(errorMsg)
            }

            // update local currentLaporan with returned data
            currentLaporan.value = json.data

            return json.data
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    async function cancelLaporanKerusakan(id: string, alasan: string) {
        loadingStore.show('Membatalkan laporan...')
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
            const response = await fetch(`${API_BASE_URL}laporan-kerusakan/${id}/cancel/`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ alasan })
            })

            const json = await response.json()
            if (!response.ok || json.status === 'error') {
                const errorMsg = json.message || (json.errors ? JSON.stringify(json.errors) : 'Gagal membatalkan laporan')
                throw new Error(errorMsg)
            }

            // update local currentLaporan with returned data
            currentLaporan.value = json.data

            return json.data
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    return { laporanList, totalLaporan, currentLaporan, fetchLaporanKerusakan, fetchLaporanDetail, createLaporanKerusakan, editLaporanKerusakan, cancelLaporanKerusakan }
})