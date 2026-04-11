/**
 * Pinia store for managing responses/messages to damage reports (Tanggapan Laporan Kerusakan).
 * 
 * This store handles fetching, creating, and managing conversation threads
 * for facility damage report responses.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet, apiAuthPost } from '@/services/api'

/**
 * Interface representing a single response message.
 */
interface Tanggapan {
    id: string
    laporan: string
    nama_pengirim: string
    pengirim_id: number | null
    pengirim_role: string | null
    pesan: string
    created_at: string
}

export const useTanggapanStore = defineStore('tanggapan', () => {
    /** Array of response messages for the current report. */
    const daftarTanggapan = ref<Tanggapan[]>([])
    
    /** Flag indicating whether responses have been loaded. */
    const isLoaded = ref(false)
    
    /** Error message if fetch/create fails. */
    const errorMessage = ref('')
    
    /**
     * Fetch all responses for a specific report (kerusakan or bullying).
     * 
     * @param laporanId - UUID of the report.
     * @param laporanType - Type of report ('kerusakan' or 'bullying'). Defaults to 'kerusakan'.
     * @returns Promise that resolves when fetch completes.
     */
    async function ambilTanggapan(laporanId: string, laporanType: string = 'kerusakan') {
        try {
            errorMessage.value = ''
            const endpoint = laporanType === 'bullying' 
                ? `laporan-bullying/${laporanId}/tanggapan/`
                : `laporan-kerusakan/${laporanId}/tanggapan/`
            const data = await apiAuthGet(endpoint)
            
            // Handle different response formats
            if (data && Array.isArray(data)) {
                daftarTanggapan.value = data
            } else if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
                daftarTanggapan.value = data.data
            } else {
                daftarTanggapan.value = []
            }
            
            isLoaded.value = true
        } catch (error: any) {
            console.error('Gagal mengambil tanggapan:', error.message)
            errorMessage.value = error.message || 'Gagal memuat tanggapan'
            daftarTanggapan.value = []
        }
    }

    /**
     * Submit a new response message to a report (kerusakan or bullying).
     * 
     * Performs optimistic update: adds message to UI immediately before server confirmation.
     * 
     * @param laporanId - UUID of the report.
     * @param pesan - The response message text.
     * @param laporanType - Type of report ('kerusakan' or 'bullying'). Defaults to 'kerusakan'.
     * @returns Promise resolving to the created response object.
     */
    async function kirimTanggapan(laporanId: string, pesan: string, laporanType: string = 'kerusakan') {
        try {
            errorMessage.value = ''
            const endpoint = laporanType === 'bullying'
                ? `laporan-bullying/${laporanId}/tanggapan/`
                : `laporan-kerusakan/${laporanId}/tanggapan/`
            const response = await apiAuthPost(
                endpoint,
                { pesan }
            )
            
            // Optimistic update: add to list immediately
            if (response && typeof response === 'object') {
                daftarTanggapan.value.push(response)
            }
            
            return response
        } catch (error: any) {
            console.error('Gagal mengirim tanggapan:', error.message)
            errorMessage.value = error.message || 'Gagal mengirim tanggapan'
            throw error
        }
    }

    /**
     * Reset store state.
     * 
     * Useful when leaving the detail page or user logs out.
     */
    function reset() {
        daftarTanggapan.value = []
        isLoaded.value = false
        errorMessage.value = ''
    }

    return {
        daftarTanggapan,
        isLoaded,
        errorMessage,
        ambilTanggapan,
        kirimTanggapan,
        reset,
    }
})
