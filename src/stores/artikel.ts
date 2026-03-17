import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet, apiAuthPost, apiAuthPut } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

// test


/**
 * Pinia store for managing article (artikel) state and actions.
 * Handles fetching, creating, and updating articles via API.
 */
export const useArtikelStore = defineStore('artikel', () => {
  /**
   * List of articles (published or all, depending on fetch method).
   */
  const daftarArtikel = ref<any[]>([])
  const detailArtikel = ref<any | null>(null)
  const isLoaded = ref(false)
  const lastFetched = ref(0)

  const loader = useLoadingStore()

  async function fetchArtikelPublik() {
    const CACHE_TIME = 2 * 60 * 1000
    const isStale = Date.now() - lastFetched.value > CACHE_TIME

    if (!isLoaded.value || isStale) {
      loader.show('Memuat artikel...')
    }
    try {
      const response = await apiAuthGet('artikel/')
      daftarArtikel.value = Array.isArray(response) ? response : (response.data || [])
      isLoaded.value = true
      lastFetched.value = Date.now()
      return response
    } catch (error) {
      throw error
    } finally {
      loader.hide()
    }
  }

  async function fetchKelolaArtikel() {
    const CACHE_TIME = 2 * 60 * 1000
    const isStale = Date.now() - lastFetched.value > CACHE_TIME

    if (!isLoaded.value || isStale) {
      loader.show('Memuat manajemen artikel...')
    }
    try {
      const response = await apiAuthGet('artikel/kelola/')
      daftarArtikel.value = Array.isArray(response) ? response : (response.data || [])
      isLoaded.value = true
      lastFetched.value = Date.now()
      return response
    } catch (error) {
      throw error
    } finally {
      loader.hide()
    }
  }


    /**
   * Fetch the details of a single article by ID.
   * Updates detailArtikel with the result.
   * @param {string} id - Article UUID
   * @returns {Promise<any>} API response
   */
  async function fetchDetailArtikel(id: string) {
    loader.show('Memuat isi artikel...')
    try {
      const response = await apiAuthGet(`artikel/${id}/`)
      detailArtikel.value = response
      return response
    } catch (error) {
      throw error
    } finally {
      loader.hide()
    }
  }


  /**
   * Create a new article (with or without image).
   * Handles both FormData (for file upload) and plain object payloads.
   * @param {object|FormData} payload - Article data or FormData with image
   * @returns {Promise<any>} API response
   */
  async function simpanArtikel(payload: object | FormData) {
    loader.show('Sedang menyimpan artikel...')
    try {
      if (payload instanceof FormData) {
        // Use fetch for FormData to handle file uploads
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
        // Use standard API helper for JSON payload
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
   * Update an existing article (with or without image).
   * Handles both FormData (for file upload) and plain object payloads.
   * @param {string} id - Article UUID
   * @param {object|FormData} payload - Updated article data or FormData with image
   * @returns {Promise<any>} API response
   */
  async function updateArtikel(id: string, payload: object | FormData) {
    loader.show('Menyimpan perubahan...')
    try {
      if (payload instanceof FormData) {
        // Use fetch for FormData to handle file uploads
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
        // Use standard API helper for JSON payload
        const response = await apiAuthPut(`artikel/${id}/`, payload)
        return response
      }
    } catch (error) {
      throw error
    } finally {
      loader.hide()
    }
  }


  // Expose state and actions for use in components
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
