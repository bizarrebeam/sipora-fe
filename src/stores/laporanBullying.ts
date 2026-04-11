import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet, apiAuthPost, apiAuthPut } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

/**
 * Pinia store for managing Bullying Reports (Laporan Bullying).
 * This store contains the global state, getters, and actions for fetching,
 * creating, editing, and cancelling bullying reports.
 */
export const useLaporanBullyingStore = defineStore('laporanBullying', () => {
    /** 
     * Array containing the list of fetched reports. 
     * It holds the current page's data when pagination is used.
     */
    const daftarLaporan = ref<any[]>([])

    /** Total count of all available reports on the server, used for pagination mechanics. */
    const totalLaporan = ref(0)

    /** Holds the details of a single report when fetched directly via ID. */
    const detailLaporan = ref<any | null>(null)

    /** Flag indicating whether the report list has been successfully loaded at least once. */
    const isLoaded = ref(false)

    /** Timestamp of the last successful metadata fetch. Used for client-side caching. */
    const lastFetched = ref(0)

    const loader = useLoadingStore()

    /**
     * Fetches a paginated, sorted, and filtered list of bullying reports.
     * Implements a simple cache mechanism (2 minutes) to prevent redundant network requests.
     * 
     * @param params - Optional query parameters for filtering and pagination.
     * @param params.sortOrder - The sorting order parameter ('asc' or 'desc'). Defaults to 'desc'.
     * @param params.status - Filter reports by status ('semua', 'menunggu', 'diproses', 'selesai', 'dibatalkan').
     * @param params.search - A search keyword to find specific reports by their title, report number, or location.
     * @param params.date - Filter reports by a specific date.
     * @param params.page - The current page number to fetch.
     * @param params.pageSize - The number of report items per page.
     */
    async function ambilLaporan(params: { sortOrder?: string; status?: string; search?: string; date?: string; page?: number; pageSize?: number } = {}) {
        const CACHE_TIME = 2 * 60 * 1000 // 2 minutes cache validity
        const isStale = Date.now() - lastFetched.value > CACHE_TIME

        // Only show global loader if not loaded yet or data is stale
        if (!isLoaded.value || isStale) {
            // loader.show('Mengambil data laporan...')
        }

        try {
            const searchParams = new URLSearchParams()
            if (params.sortOrder) searchParams.append('sort', params.sortOrder)
            else searchParams.append('sort', 'desc')

            if (params.status && params.status !== 'semua') searchParams.append('status', params.status)
            if (params.search) searchParams.append('search', params.search)
            if (params.date) searchParams.append('date', params.date)
            if (params.page) searchParams.append('page', params.page.toString())
            if (params.pageSize) searchParams.append('page_size', params.pageSize.toString())

            const data = await apiAuthGet(`laporan-bullying/?${searchParams.toString()}`)

            // Handle different pagination responses from the backend
            if (data && typeof data === 'object' && 'results' in data) {
                daftarLaporan.value = data.results || []
                totalLaporan.value = data.count || 0
            } else if (data && typeof data === 'object' && 'data' in data && 'total' in data) {
                daftarLaporan.value = data.data || []
                totalLaporan.value = data.total || 0
            } else {
                daftarLaporan.value = Array.isArray(data) ? data : []
                totalLaporan.value = Array.isArray(data) ? data.length : 0
            }

            isLoaded.value = true
            lastFetched.value = Date.now()
        } catch (error: any) {
            console.error('Gagal mengambil laporan:', error.message)
        } finally {
            // loader.hide()
        }
    }

    /**
     * Fetches the full detailed data of a specific bullying report by its unique ID.
     * 
     * @param id - The unique identifier (UUID or ID string) of the report.
     * @returns The details of the fetched report.
     */
    async function ambilDetail(id: string) {
        // loader.show('Mengambil detail laporan...')

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

    /**
     * Submits a new bullying report to the server.
     * Packages the payload into a FormData object to efficiently support
     * multi-part uploads including optional image files as evidence.
     * 
     * @param payload - The data structure containing the new report's attributes.
     * @param payload.judul - Title of the report.
     * @param payload.deskripsi - Detailed chronological description of the bullying incident.
     * @param payload.lokasi - The location where the incident occurred.
     * @param payload.tanggal_kejadian - The date the incident occurred (YYYY-MM-DD string).
     * @param payload.jenis_bullying - The classification/type of bullying (e.g., 'fisik', 'verbal').
     * @param payload.anonimitas - Whether the report should be submitted anonymously to protect the reporter.
     * @param payload.foto_bukti - An optional array of Javascript File objects providing visual evidence.
     * @returns The server response payload containing the created report details.
     */
    async function buatLaporan(payload: {
        judul: string
        deskripsi: string
        lokasi: string
        tanggal_kejadian: string
        waktu_kejadian?: string
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
            if (payload.waktu_kejadian) {
                formData.append('waktu_kejadian', payload.waktu_kejadian)
            }
            formData.append('jenis_bullying', payload.jenis_bullying)
            formData.append('anonimitas', String(payload.anonimitas))

            if (payload.foto_bukti) {
                payload.foto_bukti.forEach((file) => {
                    formData.append('foto_bukti', file)
                })
            }

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
            const response = await fetch(`${API_BASE_URL}laporan-bullying/create/`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            })

            const json = await response.json()

            if (!response.ok || json.status === 'error') {
                throw new Error(json.message || 'Gagal membuat laporan')
            }

            // Invalidate cache immediately so the new list is cleanly fetched
            isLoaded.value = false
            await ambilLaporan()
            return json.data
        } catch (error: any) {
            console.error('Gagal membuat laporan:', error.message)
            throw error
        } finally {
            loader.hide()
        }
    }

    /**
     * Updates an existing bullying report with new details or additional evidence.
     * Uses FormData to accommodate any changes to `foto_bukti`.
     * 
     * @param id - The unique identifier of the report being edited.
     * @param payload - The data object containing fields meant for update. 
     *                  Only provided values will be appended.
     */
    async function editLaporan(id: string, payload: any) {
        loader.show('Mengubah laporan...')

        try {
            const formData = new FormData()

            if (payload.judul) formData.append('judul', payload.judul)
            if (payload.deskripsi) formData.append('deskripsi', payload.deskripsi)
            if (payload.lokasi) formData.append('lokasi', payload.lokasi)
            if (payload.tanggal_kejadian) formData.append('tanggal_kejadian', payload.tanggal_kejadian)
            if (payload.waktu_kejadian) formData.append('waktu_kejadian', payload.waktu_kejadian)
            if (payload.jenis_bullying) formData.append('jenis_bullying', payload.jenis_bullying)
            if (payload.anonimitas !== undefined) formData.append('anonimitas', String(payload.anonimitas))

            if (payload.foto_bukti && payload.foto_bukti.length > 0) {
                payload.foto_bukti.forEach((file: File) => {
                    formData.append('foto_bukti', file)
                })
            }

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
            const response = await fetch(`${API_BASE_URL}laporan-bullying/${id}/edit/`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            })

            const json = await response.json()

            if (!response.ok || json.status === 'error') {
                throw new Error(json.message || 'Gagal mengedit laporan')
            }

            // Refresh the updated report details and data list
            isLoaded.value = false
            await ambilDetail(id)
            await ambilLaporan()
        } catch (error: any) {
            console.error('Gagal mengedit laporan:', error.message)
            throw error
        } finally {
            loader.hide()
        }
    }

    /**
     * Cancels an existing bullying report, typically requested by the reporter.
     * Submits a required reason defining why the report is being cancelled.
     * 
     * @param id - The identifier of the report to cancel.
     * @param alasan - The user-provided reason indicating why the report was cancelled.
     */
    async function batalkanLaporan(id: string, alasan: string) {
        loader.show('Membatalkan laporan...')

        try {
            await apiAuthPut(`laporan-bullying/${id}/cancel/`, {
                alasan_pembatalan: alasan
            })
            // Invalidate cache immediately to refetch status change properly
            isLoaded.value = false
            await ambilLaporan()
        } catch (error: any) {
            console.error('Gagal membatalkan laporan:', error.message)
            throw error
        } finally {
            loader.hide()
        }
    }

    /**
     * Updates the status of a bullying report with validation and note/reason fields.
     */
    async function updateLaporanStatus(
        id: string,
        status: string,
        reason?: string,
        note?: string
    ) {
        loader.show('Mengubah status laporan...')
        try {
            const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api/').replace(/\/$/, '')
            const endpoint = `${API_BASE}/laporan-bullying/${id}/status/`

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

            // update local detailLaporan with returned data
            detailLaporan.value = json.data

            return json.data
        } catch (error: any) {
            throw error
        } finally {
            loader.hide()
        }
    }

    /**
     * Resets the store's state arrays, objects, and caching metrics back to their initial values.
     * Commonly used to wipe residual data on user logout or when leaving the component route entirely.
     */
    function reset() {
        daftarLaporan.value = []
        totalLaporan.value = 0
        detailLaporan.value = null
        isLoaded.value = false
        lastFetched.value = 0
    }

    return {
        daftarLaporan,
        totalLaporan,
        detailLaporan,
        ambilLaporan,
        ambilDetail,
        buatLaporan,
        editLaporan,
        batalkanLaporan,
        updateLaporanStatus,
        reset
    }
})