import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet, apiAuthPost, apiAuthPut } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

export const useArtikelStore = defineStore('artikel', () => {
  const daftarArtikel = ref<any[]>([])
  const detailArtikel = ref<any | null>(null)
  const loader = useLoadingStore()

  /**
   * PBI-50: Mengambil daftar artikel Published
   */
  async function fetchArtikelPublik() {
    loader.show('Memuat artikel...')
    try {
      const response = await apiAuthGet('artikel/')
      // Kita ambil response.data karena BE membungkus list di dalam key 'data'
      daftarArtikel.value = response.data || []
      return response
    } catch (error) {
      throw error
    } finally {
      loader.hide()
    }
  }

  /**
   * PBI-52: Mengambil daftar artikel untuk kelola (Draft & Published)
   */
  async function fetchKelolaArtikel() {
    loader.show('Memuat manajemen artikel...')
    try {
      const response = await apiAuthGet('artikel/kelola/')

      // DEBUG: Tambahkan console log ini untuk intip isi response aslinya
      console.log('Response dari BE:', response)

      // Cek apakah data dibungkus dalam response.data atau langsung di response
      // Jika BE kirim { data: [...] }, maka ambil response.data
      daftarArtikel.value = response.data || response

      return response
    } catch (error) {
      console.error('Error Store:', error)
      throw error
    } finally {
      loader.hide()
    }
  }

  /**
   * PBI-50: Mengambil detail satu artikel berdasarkan ID
   * Endpoint BE: /api/artikel/<id>/
   */
  async function fetchDetailArtikel(id: string) {
    loader.show('Memuat isi artikel...')
    try {
      const response = await apiAuthGet(`artikel/${id}/`)
      detailArtikel.value = response.data
      return response
    } catch (error) {
      throw error
    } finally {
      loader.hide()
    }
  }

  /**
   * PBI-47: Menyimpan artikel baru
   */
  async function simpanArtikel(payload: object | FormData) {
    loader.show('Sedang menyimpan artikel...')
    try {
      if (payload instanceof FormData) {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
        const response = await fetch(`${API_BASE_URL}artikel/`, {
          method: 'POST',
          credentials: 'include',
          body: payload // Browser handles Content-Type boundaries automatically
        })
        const json = await response.json()
        if (!response.ok || json.status === 'error') {
            const errorMsg = json.message || json.detail || 'Gagal menyimpan artikel'
            throw new Error(errorMsg)
        }
        return json.data
      } else {
        const response = await apiAuthPost('artikel/', payload)
        return response
      }
    } catch (error) {
      throw error
    } finally {
      loader.hide()
    }
  }

  /**
   * PBI-48: Memperbarui artikel
   */
  async function updateArtikel(id: string, payload: object | FormData) {
    loader.show('Menyimpan perubahan...')
    try {
      if (payload instanceof FormData) {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
        const response = await fetch(`${API_BASE_URL}artikel/${id}/`, {
          method: 'PUT',
          credentials: 'include',
          body: payload
        })
        const json = await response.json()
        if (!response.ok || json.status === 'error') {
            const errorMsg = json.message || json.detail || 'Gagal memperbarui artikel'
            throw new Error(errorMsg)
        }
        return json.data
      } else {
        const response = await apiAuthPut(`artikel/${id}/`, payload)
        return response
      }
    } catch (error) {
      throw error
    } finally {
      loader.hide()
    }
  }

  return {
    daftarArtikel,
    detailArtikel,
    fetchArtikelPublik,
    fetchKelolaArtikel,
    fetchDetailArtikel,
    simpanArtikel,
    updateArtikel
  }
})
