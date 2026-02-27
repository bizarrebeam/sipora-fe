import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet, apiAuthPost } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

interface LaporanKerusakan {
    id: string
    no_laporan: string
    pelapor: string
    kelas: string
    lokasi: string
    deskripsi: string
    tanggal_laporan: string
    status: 'menunggu' | 'diproses' | 'selesai' | 'ditolak'
    gambar?: string
    catatan_admin?: string
}

export const useLaporanKerusakanStore = defineStore('laporanKerusakan', () => {
    const laporanList = ref<LaporanKerusakan[]>([])
    const totalLaporan = ref(0)

    const loadingStore = useLoadingStore()

    async function fetchLaporanKerusakan(params: { page: number; pageSize: number; status?: string; search?: string; date?: string }) {
        loadingStore.show('Memuat laporan kerusakan...')
        try {
            const query = new URLSearchParams({
                page: params.page.toString(),
                page_size: params.pageSize.toString(),
                ...(params.status && { status: params.status }),
                ...(params.search && { search: params.search }),
                ...(params.date && { date: params.date }),
            })
            const data = await apiAuthGet(`laporan-kerusakan/?${query}`)
            laporanList.value = data.results
            totalLaporan.value = data.total
        } catch (error: any) {
            console.error('Gagal memuat laporan kerusakan:', error)
        } finally {
            loadingStore.hide()
        }
    }

    async function createLaporanKerusakan(payload: Omit<LaporanKerusakan, 'id' | 'status'>) {
        loadingStore.show('Menyimpan laporan kerusakan...')
        try {
            await apiAuthPost('laporan-kerusakan/create', payload)
        } catch (error: any) {
            console.error('Gagal membuat laporan kerusakan:', error)
            throw error
        } finally {
            loadingStore.hide()
        }
    }

    return { laporanList, totalLaporan, fetchLaporanKerusakan, createLaporanKerusakan }
})