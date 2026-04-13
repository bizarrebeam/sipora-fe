import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'
import { useAuthStore } from '@/stores/auth'
import { useNotFoundStore } from '@/stores/notFound'
import { useServerErrorStore } from '@/stores/serverError'

interface RiwayatStatus {
    id: string
    status: string
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
    const detailAspirasi = ref<any | null>(null)

    const loadingStore = useLoadingStore()

    async function fetchAspirasi(params: { status?: string; search?: string; kategori?: string; date?: string; sort?: string; page?: number; pageSize?: number }) {
        const CACHE_TIME = 2 * 60 * 1000 // 2 minutes
        const isStale = Date.now() - lastFetched.value > CACHE_TIME

        if (!isLoaded.value || isStale) {
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
            if (params.date) {
                queryParams.push(`date=${params.date}`)
            }
            if (params.sort) {
                queryParams.push(`sort=${params.sort}`)
            }
            if (params.page) {
                queryParams.push(`page=${params.page}`)
            }
            if (params.pageSize) {
                queryParams.push(`page_size=${params.pageSize}`)
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
            // loadingStore.hide()
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
            
            isLoaded.value = false
            return json.data
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    async function fetchDetailAspirasi(id: string) {
        loadingStore.show('Memuat detail aspirasi...')
        try {
            const data = await apiAuthGet(`aspirasi/${id}/`)
            // apiAuthGet unwraps core JSON wrapper and returns `data`
            detailAspirasi.value = data
            return data
        } catch (error: any) {
            console.error('Gagal memuat detail aspirasi:', error.message)
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    async function editAspirasi(id: string, payload:any) {
        loadingStore.show('Mengubah aspirasi...')

        try {
            const formData = new FormData()

            if (payload.judul) formData.append('judul', payload.judul)
            if (payload.kategori) formData.append('kategori', payload.kategori)
            if (payload.deskripsi) formData.append('deskripsi', payload.deskripsi)
            if (payload.anonimitas !== undefined) formData.append('anonimitas', String(payload.anonimitas))
            if (payload.foto_bukti && payload.foto_bukti.length > 0) {
                payload.foto_bukti.forEach((file: File) => {
                    formData.append('foto_bukti', file)
                })
            }
            if (payload.delete_foto_ids && payload.delete_foto_ids.length > 0) {
                formData.append('delete_foto_ids', JSON.stringify(payload.delete_foto_ids))
            }

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
            const response = await fetch(`${API_BASE_URL}aspirasi/${id}/edit/`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            })

            const json = await response.json()

            if (!response.ok || json.status === 'error') {
                const errorMsg = json.message || 'Gagal memperbarui aspirasi'
                throw new Error(errorMsg)
            }

            isLoaded.value = false
            await fetchDetailAspirasi(id)
        }   catch (error: any) {
            console.error('Gagal mengedit aspirasi:', error.message)
        }  finally {
            loadingStore.hide()
        }
    }

    async function tandaiAspirasi(id: string) {
        loadingStore.show('Menandai aspirasi...')
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
            const authStore = useAuthStore()
            const notFoundStore = useNotFoundStore()
            const serverError = useServerErrorStore()

            const current = detailAspirasi.value
            if (!current) throw new Error('Tidak ada detail aspirasi yang dimuat')

            const desiredStatus = current.status_ditandai === 'ditandai' ? 'tidak_ditandai' : 'ditandai'

            const payload: any = { status_ditandai: desiredStatus }

            const response = await fetch(`${API_BASE_URL}aspirasi/${id}/`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if ([500,502,503,504].includes(response.status)) {
                serverError.show()
                throw new Error(`Server error ${response.status}`)
            }

            const json = await response.json().catch(() => ({}))

            if (!response.ok || json.status === 'error') {
                if (response.status === 401) {
                    authStore.setSessionExpired(true)
                    throw new Error('Sesi telah berakhir. Silakan login kembali.')
                }
                if (response.status === 403 || response.status === 404) {
                    notFoundStore.show()
                    throw new Error('Tidak memiliki akses atau data tidak ditemukan.')
                }
                throw new Error(json.message || 'Gagal mengubah status ditandai')
            }

            // Update local detail and return new data
            const updated = json.data || json
            detailAspirasi.value = updated
            return updated
        }
        catch (error: any) {
            throw error
        }
        finally {
            loadingStore.hide()
        }
    }

    function reset() {
        aspirasiList.value = []
        totalAspirasi.value = 0
        currentAspirasi.value = null
        isLoaded.value = false
        lastFetched.value = 0
    }

    return { 
        aspirasiList, 
        totalAspirasi, 
        currentAspirasi, 
        detailAspirasi,
        fetchAspirasi, 
        fetchDetailAspirasi, 
        createAspirasi,
        editAspirasi,
        tandaiAspirasi,
        reset
    }
})