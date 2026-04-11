import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

/**
 * Interface representing one status history entry for a damage report.
 */
interface RiwayatStatus {
    id: string
    status: string
    catatan: string | null
    diubah_oleh_nama: string
    waktu: string
}

/**
 * Interface representing one uploaded evidence photo.
 */
interface FotoBukti {
    id: string
    foto: string
    uploaded_at: string
}

/**
 * Interface representing a full Laporan Kerusakan object returned by the backend.
 */
interface LaporanKerusakan {
    id: string
    no_laporan: string
    judul: string
    lokasi: string
    deskripsi: string
    tanggal_kejadian: string
    tanggal_laporan: string
    status: 'menunggu' | 'diproses' | 'menunggu_konfirmasi_selesai' | 'selesai' | 'ditolak' | 'dibatalkan'
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
    akun_terverifikasi?: boolean
}

/**
 * Payload contract for creating a new damage report.
 */
interface CreateLaporanPayload {
    judul: string
    deskripsi: string
    lokasi: string
    tanggal_kejadian: string
    anonimitas: boolean
    foto_bukti?: File[]
}

/**
 * Payload contract for editing an existing damage report.
 */
interface EditLaporanPayload {
    judul?: string
    deskripsi?: string
    lokasi?: string
    tanggal_kejadian?: string
    anonimitas?: boolean
    foto_bukti?: File[]
}

/**
 * Pinia store for managing Facility Damage Reports (Laporan Kerusakan).
 * This store contains global state and actions for listing, creating,
 * editing, canceling, and retrieving report details.
 */
export const useLaporanKerusakanStore = defineStore('laporanKerusakan', () => {
    /** Array containing fetched report items (per current page/query). */
    const laporanList = ref<LaporanKerusakan[]>([])

    /** Total report count from server response (for pagination metadata). */
    const totalLaporan = ref(0)

    /** Stores currently opened report detail data. */
    const currentLaporan = ref<LaporanKerusakan | null>(null)

    /** Whether current user has access denied for list endpoint context. */
    const accessDenied = ref(false)

    /** Message associated with access denial state from backend. */
    const accessMessage = ref('')

    /** Flag indicating whether list data has been loaded at least once. */
    const isLoaded = ref(false)

    /** Timestamp of the last successful list fetch (for cache invalidation). */
    const lastFetched = ref(0)

    const loadingStore = useLoadingStore()

    /**
     * Fetches list of damage reports with optional filtering, sorting, and pagination.
     * Applies a lightweight 2-minute staleness check for reducing redundant calls.
     *
     * @param params - Optional query parameters.
     * @param params.status - Filter by status value.
     * @param params.search - Search by title, location, or report number.
     * @param params.date - Filter by specific incident date.
     * @param params.sort - Sort order ('asc' | 'desc').
     * @param params.page - Requested page number.
     * @param params.pageSize - Number of items per page.
     */
    async function fetchLaporanKerusakan(params: {
        status?: string
        search?: string
        date?: string
        sort?: 'asc' | 'desc'
        page?: number
        pageSize?: number
    }) {
        const CACHE_TIME = 2 * 60 * 1000 // 2 minutes
        const isStale = Date.now() - lastFetched.value > CACHE_TIME

        if (!isLoaded.value || isStale) {
            // loadingStore.show('Memuat laporan kerusakan...')
        }
        try {
            const queryParams: string[] = []
            if (params.status && params.status !== 'semua') {
                queryParams.push(`status=${params.status}`)
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
            const data = await apiAuthGet(`laporan-kerusakan/list/${queryString}`)
            
            laporanList.value = data?.laporan || []
            totalLaporan.value = data?.total || 0
            accessDenied.value = Boolean(data?.access_denied)
            accessMessage.value = data?.access_message || ''
            lastFetched.value = Date.now()
            isLoaded.value = true
        } catch (error: any) {
            throw error
        } finally {
            // loadingStore.hide()
        }
    }

    /**
     * Fetches detail information for a single damage report by ID.
     *
     * @param id - UUID of the report to retrieve.
     * @returns Detailed report object.
     */
    async function fetchLaporanDetail(id: string) {
        // loadingStore.show('Memuat detail laporan...')
        try {
            const data = await apiAuthGet(`laporan-kerusakan/${id}/`)
            currentLaporan.value = data
            return data as LaporanKerusakan
        } catch (error: any) {
            throw error
        } finally {
            // loadingStore.hide()
        }
    }

    /**
     * Creates a new damage report using multipart form data.
     * Supports optional evidence photo uploads.
     *
     * @param payload - Creation payload for report data.
     * @returns Newly created report object from server response.
     */
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
                const error = new Error(errorMsg) as Error & { fieldErrors?: Record<string, unknown> }
                if (json?.data && typeof json.data === 'object') {
                    error.fieldErrors = json.data
                }
                throw error
            }
            
            isLoaded.value = false
            return json.data
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    /**
     * Edits the currently opened damage report data.
     * Uses multipart form data to allow optional additional photos.
     *
     * @param payload - Partial editable fields to update the report.
     * @returns Updated report object from server response.
     */
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
            isLoaded.value = false
            return json.data
        } catch (error: any) {
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    /**
     * Cancels an existing report with a mandatory cancellation reason.
     *
     * @param id - UUID of the report to cancel.
     * @param alasan - User-provided cancellation reason.
     * @returns Updated report object after cancellation.
     */
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
            isLoaded.value = false
        }
    }

    /**
     * Updates the status of a damage report.
     * Only authorized admin users (kemahasiswaan) can update status.
     *
     * @param id - Report UUID
     * @param status - New status value
     * @param reason - Optional reason for rejection
     * @param note - Optional note for completion
     */
    async function updateLaporanStatus(
        id: string,
        status: string,
        reason?: string,
        note?: string
    ) {
        loadingStore.show('Mengubah status laporan...')
        try {
            const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/').replace(/\/$/, '')
            const endpoint = `${API_BASE}/laporan-kerusakan/${id}/status/`

            const body: any = { status }
            if (reason) body.reason = reason
            if (note) body.note = note

            const response = await fetch(endpoint, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })

            const json = await response.json()
            if (!response.ok || json.status === 'error') {
                const errorMsg = json.message || (json.errors ? JSON.stringify(json.errors) : 'Gagal mengubah status laporan')
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

    /**
     * Resets all store states to initial defaults.
     * Useful when leaving page context or on logout.
     */
    function reset() {
        laporanList.value = []
        totalLaporan.value = 0
        currentLaporan.value = null
        isLoaded.value = false
        lastFetched.value = 0
        accessDenied.value = false
        accessMessage.value = ''
    }

    return {
        laporanList,
        totalLaporan,
        currentLaporan,
        accessDenied,
        accessMessage,
        fetchLaporanKerusakan,
        fetchLaporanDetail,
        createLaporanKerusakan,
        editLaporanKerusakan,
        cancelLaporanKerusakan,
        updateLaporanStatus,
        reset
    }
})