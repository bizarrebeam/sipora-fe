import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiAuthGet, apiAuthPost, apiAuthPut } from '@/services/api'
import { useLoadingStore } from '@/stores/loading'

/**
 * Consultation store.
 *
 * Main responsibilities:
 * - Manage consultation schedule and booking state.
 * - Provide CRUD actions for schedules and booking creation.
 * - Provide centralized success/error messages for UI display.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Representation of a single consultation schedule slot from the API.
 */
export interface JadwalKonsultasi {
  id: string
  guru_bk: string
  nama_guru_bk: string
  nama_siswa_booking?: string | null
  kelas_siswa_booking?: string | null
  tanggal: string
  waktu_mulai: string
  waktu_selesai: string
  status: 'tersedia' | 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak' | 'dibatalkan_siswa' | 'dibatalkan_guru_bk'
  catatan: string | null
  is_booked: boolean
  dibuat_pada: string
  updated_at: string
}

/**
 * Representation of a single consultation booking item from the API.
 */
export interface BookingKonsultasi {
  id: string
  nama_siswa: string
  jadwal: string
  jadwal_detail?: JadwalKonsultasi
  tanggal_konsultasi: string
  waktu_mulai: string
  waktu_selesai: string
  deskripsi: string
  status: 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak' | 'dibatalkan_siswa' | 'dibatalkan_guru_bk' | 'selesai'
  alasan_penolakan: string | null
  alasan_pembatalan: string | null
  dibuat_pada: string
  updated_at: string
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useKonsultasiStore = defineStore('konsultasi', () => {
  // Global loader used as an async process indicator in the UI.
  const loader = useLoadingStore()

  // Fallback base URL when env is not defined.
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'

  /**
   * Normalizes errors so the UI always gets a safe message to display.
   */
  function getErrorMessage(err: unknown, fallback: string) {
    if (err instanceof Error && err.message) return err.message
    return fallback
  }

  /**
    * Unifies API response format.
   *
    * Some endpoints return raw data, while others return `{ data: ... }`.
    * This helper keeps data consumption consistent across store actions.
   */
  function unwrapResponseData(result: unknown) {
    if (result && typeof result === 'object' && 'data' in result) {
      const boxed = result as { data?: unknown }
      return boxed.data ?? result
    }
    return result
  }

  /**
    * DELETE helper with cookie credentials and backend error normalization.
   */
  async function deleteAuth(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    let json: unknown = null
    try {
      json = await response.json()
    } catch {
      json = null
    }

    if (!response.ok) {
      if (json && typeof json === 'object') {
        const data = json as Record<string, unknown>
        const message =
          (typeof data.error === 'string' && data.error) ||
          (typeof data.message === 'string' && data.message) ||
          'Gagal menghapus jadwal.'
        throw new Error(message)
      }
      throw new Error('Gagal menghapus jadwal.')
    }

    return json
  }

  // State
  // Consultation schedule slots (used by calendar/schedule pages).
  const daftarJadwal = ref<JadwalKonsultasi[]>([])
  // Consultation bookings list (used by student/counselor booking pages).
  const daftarBooking = ref<BookingKonsultasi[]>([])
  // Currently opened booking detail.
  const detailBooking = ref<BookingKonsultasi | null>(null)
  // Latest error message from store actions.
  const errorMessage = ref<string | null>(null)
  // Latest success message from store actions.
  const successMessage = ref<string | null>(null)

  /**
   * Clears success/error messages so they do not leak between actions.
   */
  function clearMessages() {
    errorMessage.value = null
    successMessage.value = null
  }

  // ── PBI-38: Jadwal ──────────────────────────────────────────────────────────

  /**
    * Fetches consultation schedules.
    * @param tanggal Optional date filter in YYYY-MM-DD format.
   */
  async function ambilJadwal(tanggal?: string) {
    loader.show('Mengambil jadwal konsultasi...')
    try {
      const params = tanggal ? `?tanggal=${tanggal}` : ''
      const result = await apiAuthGet(`konsultasi/jadwal/${params}`)
      daftarJadwal.value = (unwrapResponseData(result) as JadwalKonsultasi[]) ?? []
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal mengambil jadwal.')
    } finally {
      loader.hide()
    }
  }

  /**
    * Creates a new schedule slot, then refreshes schedules for the target date.
   */
  async function buatJadwal(payload: { tanggal: string; waktu_mulai: string; waktu_selesai: string; catatan?: string }) {
    clearMessages()
    loader.show('Menyimpan jadwal...')
    try {
      await apiAuthPost('konsultasi/jadwal/', payload)
      successMessage.value = 'Jadwal berhasil dibuat.'
      await ambilJadwal(payload.tanggal)
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal membuat jadwal.')
      return false
    } finally {
      loader.hide()
    }
  }

  /**
    * Updates a schedule slot by id, then refreshes schedules for the active date.
   */
  async function editJadwal(id: string, payload: { waktu_mulai?: string; waktu_selesai?: string; catatan?: string }, tanggal: string) {
    clearMessages()
    loader.show('Menyimpan perubahan...')
    try {
      await apiAuthPut(`konsultasi/jadwal/${id}/`, payload)
      successMessage.value = 'Jadwal berhasil diperbarui.'
      await ambilJadwal(tanggal)
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal memperbarui jadwal.')
      return false
    } finally {
      loader.hide()
    }
  }

  /**
    * Deletes a schedule slot by id, then refreshes schedules for the active date.
   */
  async function hapusJadwal(id: string, tanggal: string) {
    clearMessages()
    loader.show('Menghapus jadwal...')
    try {
      await deleteAuth(`konsultasi/jadwal/${id}/`)
      successMessage.value = 'Jadwal berhasil dihapus.'
      await ambilJadwal(tanggal)
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal menghapus jadwal.')
      return false
    } finally {
      loader.hide()
    }
  }

  // ── PBI-39 + PBI-43: Booking ────────────────────────────────────────────────

  /**
    * Fetches bookings with optional date/status filters.
   */
  async function ambilBooking(params?: { tanggal?: string; status?: string }) {
    loader.show('Mengambil daftar booking...')
    try {
      const query = new URLSearchParams()
      if (params?.tanggal) query.append('tanggal', params.tanggal)
      if (params?.status) query.append('status', params.status)
      const q = query.toString() ? `?${query.toString()}` : ''
      const result = await apiAuthGet(`konsultasi/booking/${q}`)
      daftarBooking.value = (unwrapResponseData(result) as BookingKonsultasi[]) ?? []
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal mengambil booking.')
    } finally {
      loader.hide()
    }
  }

  /**
    * Fetches booking detail by booking id.
   */
  async function ambilDetailBooking(id: string) {
    loader.show('Mengambil detail booking...')
    try {
      const result = await apiAuthGet(`konsultasi/booking/${id}/`)
      detailBooking.value = (unwrapResponseData(result) as BookingKonsultasi) ?? null
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Booking tidak ditemukan.')
    } finally {
      loader.hide()
    }
  }

  /**
    * Creates a new booking for a student.
    * After success, the store refreshes the booking list to keep the UI in sync.
   */
  async function buatBooking(payload: { jadwal: string; deskripsi: string }) {
    clearMessages()
    loader.show('Memproses booking...')
    try {
      await apiAuthPost('konsultasi/booking/', payload)
      successMessage.value = 'Booking berhasil dibuat! Menunggu konfirmasi Guru BK.'
      await ambilBooking()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal membuat booking.')
      return false
    } finally {
      loader.hide()
    }
  }

  return {
    daftarJadwal,
    daftarBooking,
    detailBooking,
    errorMessage,
    successMessage,
    clearMessages,
    ambilJadwal,
    buatJadwal,
    editJadwal,
    hapusJadwal,
    ambilBooking,
    ambilDetailBooking,
    buatBooking,
  }
})
