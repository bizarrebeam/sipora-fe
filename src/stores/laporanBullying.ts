import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet, apiAuthPost, apiAuthPut } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

export const useLaporanBullyingStore = defineStore('laporanBullying', () => {
    const daftarLaporan = ref<any[]>([])
    const detailLaporan = ref<any | null>(null)

    const loader = useLoadingStore()

    async function ambilLaporan() {
        loader.show('Mengambil data laporan...')

        try {
            daftarLaporan.value = await apiAuthGet('laporan-bullying/')
        } catch (error: any) {
            console.error('Gagal mengambil laporan:', error.message)
        } finally {
            loader.hide()
        }
    }

    async function ambilDetail(id: string) {
        loader.show('Mengambil detail laporan...')

        try {
            detailLaporan.value = await apiAuthGet(`laporan-bullying/${id}/`)
        } catch (error: any) {
            console.error('Gagal mengambil detail:', error.message)
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
    }) {
        loader.show('Mengirim laporan...')

        try {
            await apiAuthPost('laporan-bullying/create/', payload)
            await ambilLaporan() // refresh list setelah create
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
            await apiAuthPut(`laporan-bullying/${id}/edit/`, payload)
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