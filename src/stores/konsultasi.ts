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
 * - PBI-40: konfirmasi / tolak booking (Guru BK)
 * - PBI-41: batalkan booking (Siswa & Guru BK)
 * - PBI-42: reschedule booking (Siswa)
 * - Provide centralized success/error messages for UI display.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JadwalKonsultasi {
  id: string
  guru_bk: string
  nama_guru_bk: string
  nama_siswa_booking?: string | null
  kelas_siswa_booking?: string | null
  tanggal: string
  waktu_mulai: string
  waktu_selesai: string
  status: 'tersedia' | 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak' | 'dibatalkan_siswa' | 'dibatalkan_guru_bk' | 'tidak_hadir' | 'selesai'
  catatan: string | null
  is_booked: boolean
  dibuat_pada: string
  updated_at: string
}

export interface BookingKonsultasi {
  id: string
  nama_siswa: string
  kelas_siswa?: string | null
  jadwal: string
  jadwal_detail?: JadwalKonsultasi
  tanggal_konsultasi: string
  waktu_mulai: string
  waktu_selesai: string
  deskripsi: string
  status: 'menunggu_konfirmasi' | 'dikonfirmasi' | 'ditolak' | 'dibatalkan_siswa' | 'dibatalkan_guru_bk' | 'tidak_hadir' | 'selesai'
  alasan_penolakan: string | null
  alasan_pembatalan: string | null
  catatan_hasil: string | null
  dibuat_pada: string
  updated_at: string
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useKonsultasiStore = defineStore('konsultasi', () => {
  const loader = useLoadingStore()

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'

  function getErrorMessage(err: unknown, fallback: string) {
    if (err instanceof Error && err.message) return err.message
    return fallback
  }

  function unwrapResponseData(result: unknown) {
    if (result && typeof result === 'object' && 'data' in result) {
      const boxed = result as { data?: unknown }
      return boxed.data ?? result
    }
    return result
  }

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

  /**
   * PATCH helper dengan JWT Authorization header.
   * Digunakan untuk endpoint confirm, cancel, reschedule.
   */
  async function patchAuth(endpoint: string, payload: object) {
    const token = localStorage.getItem('access_token')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
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
          'Permintaan gagal.'
        throw new Error(message)
      }
      throw new Error('Permintaan gagal.')
    }

    return json
  }

  // ─── State ───────────────────────────────────────────────────────────────

  const daftarJadwal = ref<JadwalKonsultasi[]>([])
  const daftarBooking = ref<BookingKonsultasi[]>([])
  const detailBooking = ref<BookingKonsultasi | null>(null)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  function clearMessages() {
    errorMessage.value = null
    successMessage.value = null
  }

  // ── PBI-38: Jadwal ──────────────────────────────────────────────────────

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

  async function buatJadwal(payload: { tanggal: string; waktu_mulai: string; waktu_selesai: string; catatan?: string }) {
    clearMessages()
    loader.show('Menyimpan jadwal...')
    try {
      await apiAuthPost('konsultasi/jadwal/', payload)
      successMessage.value = 'Jadwal berhasil dibuat.'
      await ambilJadwal()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal membuat jadwal.')
      return false
    } finally {
      loader.hide()
    }
  }

  async function editJadwal(id: string, payload: { waktu_mulai?: string; waktu_selesai?: string; catatan?: string }, tanggal: string) {
    clearMessages()
    loader.show('Menyimpan perubahan...')
    try {
      await apiAuthPut(`konsultasi/jadwal/${id}/`, payload)
      successMessage.value = 'Jadwal berhasil diperbarui.'
      await ambilJadwal()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal memperbarui jadwal.')
      return false
    } finally {
      loader.hide()
    }
  }

  async function hapusJadwal(id: string, tanggal: string) {
    clearMessages()
    loader.show('Menghapus jadwal...')
    try {
      await deleteAuth(`konsultasi/jadwal/${id}/`)
      successMessage.value = 'Jadwal berhasil dihapus.'
      await ambilJadwal()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal menghapus jadwal.')
      return false
    } finally {
      loader.hide()
    }
  }

  // ── PBI-39 + PBI-43: Booking ────────────────────────────────────────────

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

  // ── PBI-40: Konfirmasi Booking (Guru BK) ────────────────────────────────

  /**
   * Guru BK menyetujui booking siswa.
   * PATCH /konsultasi/booking/{id}/confirm/ — { aksi: 'setujui' }
   */
  async function setujuiBooking(id: string) {
    clearMessages()
    loader.show('Memproses konfirmasi...')
    try {
      const result = await patchAuth(`konsultasi/booking/${id}/confirm/`, { aksi: 'setujui' })
      successMessage.value = 'Booking berhasil dikonfirmasi.'
      // Perbarui detailBooking jika sedang ditampilkan
      if (detailBooking.value?.id === id) {
        const data = (result as { data?: BookingKonsultasi })?.data
        if (data) detailBooking.value = data
      }
      await ambilBooking()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal mengonfirmasi booking.')
      return false
    } finally {
      loader.hide()
    }
  }

  /**
   * Guru BK menolak booking siswa.
   * PATCH /konsultasi/booking/{id}/confirm/ — { aksi: 'tolak', alasan: string }
   */
  async function tolakBooking(id: string, alasan: string) {
    clearMessages()
    loader.show('Memproses penolakan...')
    try {
      const result = await patchAuth(`konsultasi/booking/${id}/confirm/`, { aksi: 'tolak', alasan })
      successMessage.value = 'Booking berhasil ditolak.'
      if (detailBooking.value?.id === id) {
        const data = (result as { data?: BookingKonsultasi })?.data
        if (data) detailBooking.value = data
      }
      await ambilBooking()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal menolak booking.')
      return false
    } finally {
      loader.hide()
    }
  }

  // ── PBI-41: Batalkan Booking (Siswa & Guru BK) ──────────────────────────

  /**
   * Siswa atau Guru BK membatalkan booking.
   * PATCH /konsultasi/booking/{id}/cancel/ — { alasan: string }
   */
  async function batalkanBooking(id: string, alasan: string) {
    clearMessages()
    loader.show('Memproses pembatalan...')
    try {
      const result = await patchAuth(`konsultasi/booking/${id}/cancel/`, { alasan })
      successMessage.value = 'Booking berhasil dibatalkan.'
      if (detailBooking.value?.id === id) {
        const data = (result as { data?: BookingKonsultasi })?.data
        if (data) detailBooking.value = data
      }
      await ambilBooking()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal membatalkan booking.')
      return false
    } finally {
      loader.hide()
    }
  }

  // ── PBI-42: Reschedule Booking (Siswa) ──────────────────────────────────

  /**
   * Siswa mengganti slot booking ke slot lain yang masih tersedia.
   * PATCH /konsultasi/booking/{id}/reschedule/ — { jadwal_baru: UUID }
   */
  async function rescheduleBooking(id: string, jadwalBaruId: string) {
    clearMessages()
    loader.show('Memproses reschedule...')
    try {
      const result = await patchAuth(`konsultasi/booking/${id}/reschedule/`, { jadwal_baru: jadwalBaruId })
      successMessage.value = 'Booking berhasil dijadwalkan ulang.'
      if (detailBooking.value?.id === id) {
        const data = (result as { data?: BookingKonsultasi })?.data
        if (data) detailBooking.value = data
      }
      await ambilBooking()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal melakukan reschedule.')
      return false
    } finally {
      loader.hide()
    }
  }

  // add: Tandai Selesai (Guru BK) ────────────────────────────────────

  /**
   * Guru BK menandai sesi selesai + mengisi catatan hasil konsultasi.
   * PATCH /konsultasi/booking/{id}/selesai/ — { catatan_hasil: string }
   */
  async function selesaiKonsultasi(id: string, catatan_hasil: string) {
    clearMessages()
    loader.show('Menyimpan catatan hasil...')
    try {
      const result = await patchAuth(`konsultasi/booking/${id}/selesai/`, { catatan_hasil })
      successMessage.value = 'Konsultasi berhasil ditandai selesai.'
      if (detailBooking.value?.id === id) {
        const data = (result as { data?: BookingKonsultasi })?.data
        if (data) detailBooking.value = data
      }
      await ambilBooking()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal menandai konsultasi selesai.')
      return false
    } finally {
      loader.hide()
    }
  }

  // ── PBI-XX: Tandai Tidak Hadir (Guru BK) ────────────────────────────────

  /**
   * Guru BK menandai siswa tidak hadir.
   * PATCH /konsultasi/booking/{id}/tidak-hadir/
   */
  async function tandaiTidakHadir(id: string) {
    clearMessages()
    loader.show('Memproses...')
    try {
      const result = await patchAuth(`konsultasi/booking/${id}/tidak-hadir/`, {})
      successMessage.value = 'Siswa berhasil ditandai tidak hadir.'
      if (detailBooking.value?.id === id) {
        const data = (result as { data?: BookingKonsultasi })?.data
        if (data) detailBooking.value = data
      }
      await ambilBooking()
      return true
    } catch (err: unknown) {
      errorMessage.value = getErrorMessage(err, 'Gagal menandai tidak hadir.')
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
    // PBI-38
    ambilJadwal,
    buatJadwal,
    editJadwal,
    hapusJadwal,
    // PBI-39 & PBI-43
    ambilBooking,
    ambilDetailBooking,
    buatBooking,
    // PBI-40
    setujuiBooking,
    tolakBooking,
    // PBI-41
    batalkanBooking,
    // PBI-42
    rescheduleBooking,
    //add
    selesaiKonsultasi,
    tandaiTidakHadir,
  }
})
