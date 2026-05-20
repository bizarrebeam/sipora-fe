<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SChip from '@/components/SChip.vue'
import SDialog from '@/components/SDialog.vue'
import STextField from '@/components/STextField.vue'
import SDatePicker from '@/components/SDatePicker.vue'
import SPagination from '@/components/SPagination.vue'
import SModal from '@/components/SModal.vue'
import { useKonsultasiStore, type BookingKonsultasi, type JadwalKonsultasi } from '@/stores/konsultasi'
import { useAuthStore } from '@/stores/auth'
import { apiAuthGet } from '@/services/api'

// ─── Store & Auth ─────────────────────────────────────────────────────────────

const store = useKonsultasiStore()
const authStore = useAuthStore()
const isGuruBK = computed(() => authStore.user?.role === 'guru_bk')
const isSiswa = computed(() => authStore.user?.role === 'siswa')

// ─── Filter State ─────────────────────────────────────────────────────────────

const filterTanggal = ref('')
const filterStatus = ref('')
const search = ref('')
const sortOrder = ref<'desc' | 'asc'>('desc')
const selectedDateObj = ref<Date | null>(null)
const showDatePicker = ref(false)

const statusTabs = [
  { value: '', label: 'Semua' },
  { value: 'menunggu_konfirmasi', label: 'Menunggu' },
  { value: 'dikonfirmasi', label: 'Dikonfirmasi' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'dibatalkan_siswa', label: 'Batal Siswa' },
  { value: 'dibatalkan_guru_bk', label: 'Batal Guru BK' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'tidak_hadir', label: 'Tidak Hadir' },
]

// ─── Detail Dialog ────────────────────────────────────────────────────────────

const showDetailDialog = ref(false)
const selectedBooking = ref<BookingKonsultasi | null>(null)

function openDetail(booking: BookingKonsultasi) {
  selectedBooking.value = booking
  showDetailDialog.value = true
}

// ─── PBI-40: Konfirmasi / Tolak (Guru BK) ────────────────────────────────────

const showKonfirmasiDialog = ref(false)
const showTolakDialog = ref(false)
const alasanTolak = ref('')
const bookingToAct = ref<BookingKonsultasi | null>(null)

function openKonfirmasiDialog(booking: BookingKonsultasi) {
  bookingToAct.value = booking
  showKonfirmasiDialog.value = true
  showDetailDialog.value = false
}

function openTolakDialog(booking: BookingKonsultasi) {
  bookingToAct.value = booking
  alasanTolak.value = ''
  showTolakDialog.value = true
  showDetailDialog.value = false
}

async function confirmSetujui() {
  if (!bookingToAct.value) return
  const ok = await store.setujuiBooking(bookingToAct.value.id)
  showKonfirmasiDialog.value = false
  if (ok) {
    showSuccessModal.value = true
    feedbackMessage.value = store.successMessage ?? 'Booking berhasil dikonfirmasi.'
    store.clearMessages()
  } else {
    showErrorModal.value = true
    feedbackMessage.value = store.errorMessage ?? 'Gagal mengonfirmasi booking.'
    store.clearMessages()
  }
}

async function confirmTolak() {
  if (!bookingToAct.value || !alasanTolak.value.trim()) return
  const ok = await store.tolakBooking(bookingToAct.value.id, alasanTolak.value.trim())
  showTolakDialog.value = false
  if (ok) {
    showSuccessModal.value = true
    feedbackMessage.value = store.successMessage ?? 'Booking berhasil ditolak.'
    store.clearMessages()
  } else {
    showErrorModal.value = true
    feedbackMessage.value = store.errorMessage ?? 'Gagal menolak booking.'
    store.clearMessages()
  }
}

// ─── PBI-41: Batalkan Booking ─────────────────────────────────────────────────

const showBatalDialog = ref(false)
const alasanBatal = ref('')

function openBatalDialog(booking: BookingKonsultasi) {
  bookingToAct.value = booking
  alasanBatal.value = ''
  showBatalDialog.value = true
  showDetailDialog.value = false
}

async function confirmBatal() {
  if (!bookingToAct.value || !alasanBatal.value.trim()) return
  const ok = await store.batalkanBooking(bookingToAct.value.id, alasanBatal.value.trim())
  showBatalDialog.value = false
  if (ok) {
    showSuccessModal.value = true
    feedbackMessage.value = store.successMessage ?? 'Booking berhasil dibatalkan.'
    store.clearMessages()
  } else {
    showErrorModal.value = true
    feedbackMessage.value = store.errorMessage ?? 'Gagal membatalkan booking.'
    store.clearMessages()
  }
}

// Cek apakah waktu konsultasi sudah lewat
function isWaktuSudahLewat(booking: BookingKonsultasi): boolean {
  const dateStr = booking.tanggal_konsultasi
  const timeStr = booking.waktu_mulai
  if (!dateStr || !timeStr) return false
  const dt = new Date(`${dateStr}T${timeStr.slice(0, 5)}:00`)
  return dt.getTime() < Date.now()
}

function canBatalkan(booking: BookingKonsultasi): boolean {
  if (!['menunggu_konfirmasi', 'dikonfirmasi'].includes(booking.status)) return false
  return !isWaktuSudahLewat(booking)
}

function canReschedule(booking: BookingKonsultasi): boolean {
  if (booking.status !== 'menunggu_konfirmasi') return false
  return !isWaktuSudahLewat(booking)
}

// ─── PBI-42: Reschedule Booking (Siswa) ──────────────────────────────────────

const showRescheduleDialog = ref(false)
const showRescheduleConfirmDialog = ref(false)
const slotTersedia = ref<JadwalKonsultasi[]>([])
const loadingSlots = ref(false)
const selectedSlotBaru = ref<JadwalKonsultasi | null>(null)

async function openRescheduleDialog(booking: BookingKonsultasi) {
  bookingToAct.value = booking
  selectedSlotBaru.value = null
  showRescheduleDialog.value = true
  showDetailDialog.value = false
  await loadSlotTersedia()
}

async function loadSlotTersedia() {
  loadingSlots.value = true
  try {
    const result = await apiAuthGet('konsultasi/jadwal/')
    const payload = (result && typeof result === 'object' && 'data' in result)
      ? (result as { data?: unknown }).data
      : result
    const all = (payload as JadwalKonsultasi[]) ?? []
    const currentJadwalId = bookingToAct.value?.jadwal
    const now = Date.now()
    slotTersedia.value = all.filter(j => {
      if (j.status !== 'tersedia') return false
      if (j.id === currentJadwalId) return false
      const slotDt = new Date(`${j.tanggal}T${j.waktu_mulai.slice(0, 5)}:00`)
      return slotDt.getTime() > now
    })
  } catch {
    slotTersedia.value = []
  } finally {
    loadingSlots.value = false
  }
}

function selectSlotBaru(slot: JadwalKonsultasi) {
  selectedSlotBaru.value = slot
}

function proceedRescheduleConfirm() {
  if (!selectedSlotBaru.value) return
  showRescheduleDialog.value = false
  showRescheduleConfirmDialog.value = true
}

async function confirmReschedule() {
  if (!bookingToAct.value || !selectedSlotBaru.value) return
  const ok = await store.rescheduleBooking(bookingToAct.value.id, selectedSlotBaru.value.id)
  showRescheduleConfirmDialog.value = false
  if (ok) {
    showSuccessModal.value = true
    feedbackMessage.value = store.successMessage ?? 'Booking berhasil dijadwalkan ulang.'
    store.clearMessages()
  } else {
    showErrorModal.value = true
    feedbackMessage.value = store.errorMessage ?? 'Gagal melakukan reschedule.'
    store.clearMessages()
  }
}

// ─── Feedback Modals ──────────────────────────────────────────────────────────

const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const feedbackMessage = ref('')

// ─── Table config ─────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function fmtTanggal(dateStr: string) {
  if (!dateStr) return '-'
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3) return dateStr
  const [y, m, d] = parts as [number, number, number]
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d) || m < 1 || m > 12) return dateStr
  return `${d} ${MONTHS[m - 1]} ${y}`
}

function fmtTanggalWaktu(dateStr: string, timeStr: string) {
  return `${fmtTanggal(dateStr)}, ${timeStr?.slice(0, 5) ?? ''}`
}

const tableColumns = computed(() => {
  const cols = [
    { key: 'tanggal_konsultasi', label: 'Tanggal' },
    { key: 'waktu', label: 'Waktu' },
    { key: 'dibuat_pada', label: 'Dibuat Pada' },
    { key: 'status', label: 'Status' },
    { key: 'aksi', label: '' },
  ]
  if (isGuruBK.value) {
      cols.splice(1, 0, { key: 'nama_siswa', label: 'Nama Siswa' })
      cols.splice(2, 0, { key: 'kelas', label: 'Kelas' }) // <-- Tambahkan baris ini
  }
  return cols
})


// ─── add ──────────────────────────────────────────────────────────────

const showSelesaiDialog = ref(false)
const catatanHasil = ref('')
const showTidakHadirDialog = ref(false)

// Guru BK bisa tandai selesai jika: dikonfirmasi + waktu sudah lewat
function canSelesai(booking: BookingKonsultasi): boolean {
  if (!isGuruBK.value) return false
  if (booking.status !== 'dikonfirmasi') return false
  return isWaktuSudahLewat(booking)
  // return true // HACK: Bypass untuk testing di sini
}

// Guru BK bisa tandai tidak hadir jika: dikonfirmasi + waktu sudah lewat
function canTidakHadir(booking: BookingKonsultasi): boolean {
  if (!isGuruBK.value) return false
  if (booking.status !== 'dikonfirmasi') return false
  return isWaktuSudahLewat(booking)
  // return true // HACK: Bypass untuk testing di sini
}

// ─── Selesai Konsultasi ───────────────────────────────────────────────────────
function openSelesaiDialog(booking: BookingKonsultasi) {
  bookingToAct.value = booking
  catatanHasil.value = ''
  showSelesaiDialog.value = true
  showDetailDialog.value = false
}

async function confirmSelesai() {
  if (!bookingToAct.value || !catatanHasil.value.trim()) return
  const ok = await store.selesaiKonsultasi(bookingToAct.value.id, catatanHasil.value.trim())
  showSelesaiDialog.value = false
  if (ok) {
    showSuccessModal.value = true
    feedbackMessage.value = store.successMessage ?? 'Konsultasi berhasil ditandai selesai.'
    store.clearMessages()
  } else {
    showErrorModal.value = true
    feedbackMessage.value = store.errorMessage ?? 'Gagal menandai selesai.'
    store.clearMessages()
  }
}

// ─── Tidak Hadir ──────────────────────────────────────────────────────────────
function openTidakHadirDialog(booking: BookingKonsultasi) {
  bookingToAct.value = booking
  showTidakHadirDialog.value = true
  showDetailDialog.value = false
}

async function confirmTidakHadir() {
  if (!bookingToAct.value) return
  const ok = await store.tandaiTidakHadir(bookingToAct.value.id)
  showTidakHadirDialog.value = false
  if (ok) {
    showSuccessModal.value = true
    feedbackMessage.value = store.successMessage ?? 'Siswa berhasil ditandai tidak hadir.'
    store.clearMessages()
  } else {
    showErrorModal.value = true
    feedbackMessage.value = store.errorMessage ?? 'Gagal menandai tidak hadir.'
    store.clearMessages()
  }
}

// ─── Chip helper ──────────────────────────────────────────────────────────────

function chipTone(status: string) {
  if (status === 'menunggu_konfirmasi') return 'warning'
  if (status === 'dikonfirmasi') return 'info'
  if (status === 'selesai') return 'success'
  if (status === 'tidak_hadir') return 'neutral'
  return 'danger'
}

function chipLabel(status: string) {
  const map: Record<string, string> = {
    menunggu_konfirmasi: 'Menunggu Konfirmasi',
    dikonfirmasi: 'Dikonfirmasi',
    ditolak: 'Ditolak',
    dibatalkan_siswa: 'Dibatalkan Siswa',
    dibatalkan_guru_bk: 'Dibatalkan Guru BK',
    tidak_hadir: 'Tidak Hadir',
    selesai: 'Selesai',
  }
  return map[status] ?? status
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchBooking() {
  await store.ambilBooking({
    tanggal: filterTanggal.value || undefined,
  })
}

watch(selectedDateObj, (newVal) => {
  if (newVal) {
    const yyyy = newVal.getFullYear()
    const mm = String(newVal.getMonth() + 1).padStart(2, '0')
    const dd = String(newVal.getDate()).padStart(2, '0')
    filterTanggal.value = `${yyyy}-${mm}-${dd}`
  } else {
    filterTanggal.value = ''
  }
  showDatePicker.value = false
  fetchBooking()
})

const statusCounts = computed(() => {
  const list = store.daftarBooking
  return {
    semua: list.length,
    menunggu_konfirmasi: list.filter((b) => b.status === 'menunggu_konfirmasi').length,
    dikonfirmasi: list.filter((b) => b.status === 'dikonfirmasi').length,
    ditolak: list.filter((b) => b.status === 'ditolak').length,
    dibatalkan_siswa: list.filter((b) => b.status === 'dibatalkan_siswa').length,
    dibatalkan_guru_bk: list.filter((b) => b.status === 'dibatalkan_guru_bk').length,
    tidak_hadir: list.filter((b) => b.status === 'tidak_hadir').length,
    selesai: list.filter((b) => b.status === 'selesai').length,
  }
})

const filteredBookings = computed(() => {
  let list = [...store.daftarBooking]

  if (filterStatus.value) {
    list = list.filter((b) => b.status === filterStatus.value)
  }

  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter((b) => {
      return (
        b.deskripsi.toLowerCase().includes(q) ||
        b.nama_siswa.toLowerCase().includes(q) ||
        b.tanggal_konsultasi.toLowerCase().includes(q)
      )
    })
  }

  list.sort((a, b) => {
    const ta = new Date(a.dibuat_pada).getTime()
    const tb = new Date(b.dibuat_pada).getTime()
    return sortOrder.value === 'desc' ? tb - ta : ta - tb
  })

  return list
})

// ─── Pagination ───────────────────────────────────────────────────────────────

const currentPage = ref(1)
const pageSize = ref(10)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredBookings.value.length / pageSize.value))
)

const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredBookings.value.slice(start, start + pageSize.value)
})

watch([filterStatus, search, filterTanggal, sortOrder], () => {
  currentPage.value = 1
})

onMounted(() => {
  fetchBooking()
})
</script>


<template>
  <div class="stf-page">
    <div class="stf-container">
      <!-- Back Button -->
      <div>
        <button
          @click="$router.push(isGuruBK ? '/jadwal-konsultasi' : '/booking-konsultasi')"
          class="flex items-center gap-2 text-[#2e3094] font-['Be_Vietnam_Pro'] font-semibold text-[14px] hover:underline"
        >
          <span>&larr;</span> Kembali
        </button>
      </div>

      <!-- Header -->
      <div class="stf-header">
        <div class="stf-header-text">
          <h1 class="stf-page-title">Daftar Booking Konsultasi</h1>
          <p class="stf-page-subtitle">
            {{ isGuruBK ? 'Pantau seluruh booking konsultasi dari siswa.' : 'Lihat riwayat dan status booking konsultasimu.' }}
          </p>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          @click="filterStatus = tab.value"
          class="tab-btn"
          :class="filterStatus === tab.value ? 'tab-btn--active' : 'tab-btn--inactive'"
        >
          {{ tab.label }}
          <span class="tab-badge" :class="filterStatus === tab.value ? 'tab-badge--active' : 'tab-badge--inactive'">
            {{ statusCounts[(tab.value || 'semua') as keyof typeof statusCounts] || 0 }}
          </span>
        </button>
      </div>

      <!-- Filter Row -->
      <div class="filters-row">
        <div class="filter-search">
          <STextField
            v-model="search"
            placeholder="Cari nama siswa, tanggal, atau alasan..."
            variant="text"
          />
        </div>

        <div class="filter-extras">
          <div class="relative">
            <button
              type="button"
              class="filter-input flex items-center gap-2 bg-white"
              @click="showDatePicker = !showDatePicker"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {{ filterTanggal || 'Pilih Tanggal' }}
            </button>
            <div v-if="showDatePicker" class="absolute left-0 md:left-auto md:right-0 top-[52px] z-[60] shadow-xl border rounded-2xl overflow-hidden scale-90 origin-top-left md:origin-top-right bg-white">
              <SDatePicker @close="showDatePicker = false" v-model="selectedDateObj" />
            </div>
          </div>

          <select v-model="sortOrder" class="filter-input">
            <option value="desc">Terbaru</option>
            <option value="asc">Terlama</option>
          </select>
        </div>
      </div>

      <!-- Tabel Booking -->
      <SCard padding="0px">

        <div v-if="filteredBookings.length === 0" class="flex flex-col items-center justify-center py-12 text-center gap-2">
          <p class="body-b7 text-neutral-500">Tidak ada data booking ditemukan.</p>
          <p class="body-b8 text-neutral-400">
            {{ filterTanggal || filterStatus || search ? 'Coba ubah filter pencarian.' : 'Belum ada booking yang dibuat.' }}
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-general-border bg-general-frame">
                <th v-for="col in tableColumns" :key="col.key"
                  class="px-5 py-3 text-left body-b8 text-neutral-500 font-semibold uppercase tracking-wide">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-general-border">
              <tr
                v-for="booking in paginatedBookings"
                :key="booking.id"
                class="hover:bg-general-frame transition-colors"
              >
                <td class="px-5 py-4">
                  <span class="body-b7 text-general-black">{{ fmtTanggal(booking.tanggal_konsultasi) }}</span>
                </td>

                <td v-if="isGuruBK" class="px-5 py-4">
                  <span class="body-b7 text-general-black">{{ booking.nama_siswa }}</span>
                </td>

                <td v-if="isGuruBK" class="px-5 py-4">
                  <span class="body-b7 text-general-black">{{ booking.kelas_siswa || '-' }}</span>
                </td>

                <td class="px-5 py-4">
                  <span class="body-b7 text-general-black">{{ booking.waktu_mulai }} – {{ booking.waktu_selesai }}</span>
                </td>

                <td class="px-5 py-4">
                  <span class="body-b7 text-general-black">{{ new Date(booking.dibuat_pada).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</span>
                </td>

                <td class="px-5 py-4">
                  <SChip :label="chipLabel(booking.status)" :tone="chipTone(booking.status)" size="medium" />
                </td>

                <td class="px-5 py-4">
                  <div class="flex items-center gap-2">
                    <SButton label="Detail" variant="action" size="small" @click="openDetail(booking)">
                      <template #left-icon>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </template>
                    </SButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-5 py-4 border-t border-general-border">
            <span class="body-b8 text-neutral-500">
              Menampilkan {{ filteredBookings.length === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, filteredBookings.length) }}
              dari {{ filteredBookings.length }} data
            </span>
            <SPagination v-model="currentPage" :total-pages="totalPages" />
          </div>
        </div>
      </SCard>

      <!-- ── Dialog: Detail Booking ──────────────────────────────────────────── -->
      <SDialog :visible="showDetailDialog" title="Detail Booking" @update:visible="showDetailDialog = $event">
        <div v-if="selectedBooking" class="flex flex-col gap-4">
          <div class="grid gap-2 body-b7">
            <div v-if="isGuruBK" class="flex gap-4 py-2 border-b border-general-border">
              <span class="text-neutral-500 w-32 shrink-0">Nama Siswa</span>
              <span class="text-general-black font-semibold">{{ selectedBooking.nama_siswa }}</span>
            </div>

            <div v-if="isGuruBK" class="flex gap-4 py-2 border-b border-general-border">
              <span class="text-neutral-500 w-32 shrink-0">Kelas Siswa</span>
              <span class="text-general-black font-semibold">{{ selectedBooking.kelas_siswa || '-' }}</span>
            </div>

            <div class="flex gap-4 py-2 border-b border-general-border">
              <span class="text-neutral-500 w-32 shrink-0">Tanggal</span>
              <span class="text-general-black">{{ fmtTanggal(selectedBooking.tanggal_konsultasi) }}</span>
            </div>

            <div class="flex gap-4 py-2 border-b border-general-border">
              <span class="text-neutral-500 w-32 shrink-0">Waktu</span>
              <span class="text-general-black">{{ selectedBooking.waktu_mulai }} – {{ selectedBooking.waktu_selesai }}</span>
            </div>

            <div class="flex gap-4 py-2 border-b border-general-border">
              <span class="text-neutral-500 w-32 shrink-0">Alasan</span>
              <span class="text-general-black">{{ selectedBooking.deskripsi }}</span>
            </div>

            <div class="flex gap-4 py-2 border-b border-general-border items-center">
              <span class="text-neutral-500 w-32 shrink-0">Status</span>
              <SChip :label="chipLabel(selectedBooking.status)" :tone="chipTone(selectedBooking.status)" size="medium" />
            </div>

            <div v-if="selectedBooking.alasan_penolakan" class="flex gap-4 py-2 border-b border-general-border">
              <span class="text-neutral-500 w-32 shrink-0">Alasan Tolak</span>
              <span class="text-red-600">{{ selectedBooking.alasan_penolakan }}</span>
            </div>

            <div v-if="selectedBooking.alasan_pembatalan" class="flex gap-4 py-2 border-b border-general-border">
              <span class="text-neutral-500 w-32 shrink-0">Alasan Batal</span>
              <span class="text-red-600">{{ selectedBooking.alasan_pembatalan }}</span>
            </div>

            <!-- Catatan hasil konsultasi (tampil jika sudah selesai) -->
            <div v-if="selectedBooking.catatan_hasil" class="flex gap-4 py-2 border-b border-general-border">
              <span class="text-neutral-500 w-32 shrink-0">Catatan Hasil</span>
              <span class="text-general-black">{{ selectedBooking.catatan_hasil }}</span>
            </div>

            <div class="flex gap-4 py-2">
              <span class="text-neutral-500 w-32 shrink-0">Dibuat pada</span>
              <span class="text-neutral-500 body-b8">{{ new Date(selectedBooking.dibuat_pada).toLocaleString('id-ID') }}</span>
            </div>
          </div>
        </div>

        <template #actions>
          <!-- PBI-40: Guru BK — Setujui & Tolak -->
          <template v-if="isGuruBK && selectedBooking?.status === 'menunggu_konfirmasi'">
            <SButton label="Tolak" variant="danger" size="medium" @click="openTolakDialog(selectedBooking!)" />
            <SButton label="Setujui" variant="primary" size="medium" @click="openKonfirmasiDialog(selectedBooking!)" />
          </template>

          <!-- PBI-41: Batalkan Booking (hanya jika waktu belum lewat) -->
          <template v-if="selectedBooking && canBatalkan(selectedBooking)">
            <SButton label="Batalkan Reservasi" variant="secondary" size="medium" @click="openBatalDialog(selectedBooking!)" />
          </template>

          <!-- PBI-42: Reschedule (Siswa, hanya menunggu_konfirmasi dan waktu belum lewat) -->
          <template v-if="isSiswa && selectedBooking && canReschedule(selectedBooking)">
            <SButton label="Reschedule" variant="action" size="medium" @click="openRescheduleDialog(selectedBooking!)" />
          </template>

          <!-- Tandai Selesai (Guru BK, dikonfirmasi + waktu sudah lewat) -->
          <template v-if="selectedBooking && canSelesai(selectedBooking)">
            <SButton label="Tandai Selesai" variant="primary" size="medium" @click="openSelesaiDialog(selectedBooking!)" />
          </template>

          <!-- Tidak Hadir (Guru BK, dikonfirmasi + waktu sudah lewat) -->
          <template v-if="selectedBooking && canTidakHadir(selectedBooking)">
            <SButton label="Tidak Hadir" variant="secondary" size="medium" @click="openTidakHadirDialog(selectedBooking!)" />
          </template>

          <SButton label="Tutup" variant="secondary" size="medium" @click="showDetailDialog = false" />
        </template>
      </SDialog>

      <!-- ── Dialog: Konfirmasi Setujui (PBI-40) ────────────────────────────── -->
      <SDialog :visible="showKonfirmasiDialog" title="Konfirmasi Booking" @update:visible="showKonfirmasiDialog = $event">
        <div class="flex flex-col gap-4">
          <p class="body-b7 text-neutral-600">
            Apakah kamu yakin ingin <span class="font-semibold text-blue-700">menyetujui</span> booking dari
            <span class="font-semibold text-general-black">{{ bookingToAct?.nama_siswa }}</span>?
          </p>
          <div class="p-3 rounded-lg bg-general-frame border border-general-border flex flex-col gap-1 body-b8">
            <div class="flex gap-3">
              <span class="text-neutral-500 w-24">Tanggal</span>
              <span class="font-semibold text-general-black">{{ fmtTanggal(bookingToAct?.tanggal_konsultasi ?? '') }}</span>
            </div>
            <div class="flex gap-3">
              <span class="text-neutral-500 w-24">Waktu</span>
              <span class="font-semibold text-general-black">{{ bookingToAct?.waktu_mulai }} – {{ bookingToAct?.waktu_selesai }}</span>
            </div>
          </div>
          <p class="body-b8 text-neutral-500">Setelah disetujui, slot jadwal akan terkunci dan tidak dapat diubah.</p>
        </div>
        <template #actions>
          <SButton label="Batal" variant="secondary" size="medium" @click="showKonfirmasiDialog = false" />
          <SButton label="Ya, Setujui" variant="primary" size="medium" @click="confirmSetujui" />
        </template>
      </SDialog>

      <!-- ── Dialog: Tolak Booking (PBI-40) ────────────────────────────────── -->
      <SDialog :visible="showTolakDialog" title="Tolak Booking" variant="danger" @update:visible="showTolakDialog = $event">
        <div class="flex flex-col gap-4">
          <p class="body-b7 text-neutral-600">
            Masukkan alasan penolakan booking dari
            <span class="font-semibold text-general-black">{{ bookingToAct?.nama_siswa }}</span>.
          </p>
          <STextField
            label="Alasan Penolakan"
            variant="textarea"
            v-model="alasanTolak"
            placeholder="Contoh: Jadwal berbenturan dengan kegiatan lain..."
            required
          />
          <p v-if="alasanTolak.trim().length > 0 && (alasanTolak.trim().length < 20 || alasanTolak.trim().length > 150)" class="body-b8 text-red-500 -mt-2">
            Alasan penolakan harus 20 - 150 karakter.
          </p>
          <p v-else-if="alasanTolak.trim().length === 0" class="body-b8 text-red-500 -mt-2">
            Alasan penolakan wajib diisi.
          </p>
        </div>
        <template #actions>
          <SButton label="Batal" variant="secondary" size="medium" @click="showTolakDialog = false" />
          <SButton
            label="Ya, Tolak Booking"
            variant="danger"
            size="medium"
            :disabled="!alasanTolak.trim() || alasanTolak.trim().length < 20 || alasanTolak.trim().length > 150"
            @click="confirmTolak"
          />
        </template>
      </SDialog>

      <!-- ── Dialog: Batalkan Booking (PBI-41) ─────────────────────────────── -->
      <SDialog :visible="showBatalDialog" title="Batalkan Booking" variant="danger" @update:visible="showBatalDialog = $event">
        <div class="flex flex-col gap-4">
          <p class="body-b7 text-neutral-600">
            Apakah kamu yakin ingin membatalkan booking pada
            <span class="font-semibold text-general-black">
              {{ fmtTanggalWaktu(bookingToAct?.tanggal_konsultasi ?? '', bookingToAct?.waktu_mulai ?? '') }}
            </span>?
          </p>
          <STextField
            label="Alasan Pembatalan"
            variant="textarea"
            v-model="alasanBatal"
            placeholder="Ceritakan alasan pembatalan booking ini..."
            required
          />
          <p v-if="alasanBatal.trim().length > 0 && (alasanBatal.trim().length < 20 || alasanBatal.trim().length > 150)" class="body-b8 text-red-500 -mt-2">
            Alasan pembatalan harus 20 - 150 karakter.
          </p>
          <p v-else-if="alasanBatal.trim().length === 0" class="body-b8 text-red-500 -mt-2">
            Alasan pembatalan wajib diisi.
          </p>
          <p class="body-b8 text-neutral-500">Setelah dibatalkan, slot jadwal akan tersedia kembali untuk siswa lain.</p>
        </div>
        <template #actions>
          <SButton label="Tidak" variant="secondary" size="medium" @click="showBatalDialog = false" />
          <SButton
            label="Ya, Batalkan"
            variant="danger"
            size="medium"
            :disabled="!alasanBatal.trim() || alasanBatal.trim().length < 20 || alasanBatal.trim().length > 150"
            @click="confirmBatal"
          />
        </template>
      </SDialog>

      <!-- ── Dialog: Pilih Slot Reschedule (PBI-42) ────────────────────────── -->
      <SDialog :visible="showRescheduleDialog" title="Pilih Slot Baru" @update:visible="showRescheduleDialog = $event">
        <div class="flex flex-col gap-4">
          <p class="body-b7 text-neutral-600">
            Pilih slot jadwal baru untuk booking kamu.
            Slot lama pada <span class="font-semibold">{{ fmtTanggalWaktu(bookingToAct?.tanggal_konsultasi ?? '', bookingToAct?.waktu_mulai ?? '') }}</span>
            akan dikembalikan ke status tersedia.
          </p>

          <div v-if="loadingSlots" class="flex items-center justify-center py-6">
            <p class="body-b8 text-neutral-400">Memuat slot tersedia...</p>
          </div>

          <div v-else-if="slotTersedia.length === 0" class="py-4 text-center">
            <p class="body-b7 text-neutral-500">Tidak ada slot tersedia saat ini.</p>
          </div>

          <div v-else class="flex flex-col gap-2 max-h-64 overflow-y-auto">
            <div
              v-for="slot in slotTersedia"
              :key="slot.id"
              class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="selectedSlotBaru?.id === slot.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-general-border hover:bg-general-frame'"
              @click="selectSlotBaru(slot)"
            >
              <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                :class="selectedSlotBaru?.id === slot.id ? 'border-blue-500' : 'border-neutral-300'">
                <div v-if="selectedSlotBaru?.id === slot.id" class="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
              <div class="flex-1">
                <p class="subheading-s8 text-general-black">{{ fmtTanggal(slot.tanggal) }}</p>
                <p class="body-b8 text-neutral-500">{{ slot.waktu_mulai }} – {{ slot.waktu_selesai }} · {{ slot.nama_guru_bk }}</p>
                <p v-if="slot.catatan" class="body-b8 text-neutral-400">{{ slot.catatan }}</p>
              </div>
            </div>
          </div>
        </div>
        <template #actions>
          <SButton label="Batal" variant="secondary" size="medium" @click="showRescheduleDialog = false" />
          <SButton
            label="Lanjut"
            variant="primary"
            size="medium"
            :disabled="!selectedSlotBaru"
            @click="proceedRescheduleConfirm"
          />
        </template>
      </SDialog>

      <!-- ── Dialog: Konfirmasi Reschedule (PBI-42) ─────────────────────────── -->
      <SDialog :visible="showRescheduleConfirmDialog" title="Konfirmasi Reschedule" @update:visible="showRescheduleConfirmDialog = $event">
        <div class="flex flex-col gap-4">
          <p class="body-b7 text-neutral-600">Apakah kamu yakin ingin mengganti jadwal booking?</p>
          <div class="p-3 rounded-lg bg-general-frame border border-general-border flex flex-col gap-2 body-b8">
            <div>
              <p class="text-neutral-500 mb-0.5">Jadwal Lama</p>
              <p class="subheading-s8 text-neutral-400 line-through">
                {{ fmtTanggalWaktu(bookingToAct?.tanggal_konsultasi ?? '', bookingToAct?.waktu_mulai ?? '') }}
              </p>
            </div>
            <div class="border-t border-general-border pt-2">
              <p class="text-neutral-500 mb-0.5">Jadwal Baru</p>
              <p class="subheading-s8 text-general-black">
                {{ fmtTanggalWaktu(selectedSlotBaru?.tanggal ?? '', selectedSlotBaru?.waktu_mulai ?? '') }}
                – {{ selectedSlotBaru?.waktu_selesai }}
              </p>
              <p class="body-b8 text-neutral-500">{{ selectedSlotBaru?.nama_guru_bk }}</p>
            </div>
          </div>
          <p class="body-b8 text-neutral-500">Booking akan kembali menunggu konfirmasi dari Guru BK.</p>
        </div>
        <template #actions>
          <SButton label="Kembali" variant="secondary" size="medium" @click="showRescheduleConfirmDialog = false; showRescheduleDialog = true" />
          <SButton label="Ya, Reschedule" variant="primary" size="medium" @click="confirmReschedule" />
        </template>
      </SDialog>

      <!-- ── Dialog: Tandai Selesai ─────────────────────────────────────────── -->
      <SDialog
        :visible="showSelesaiDialog"
        title="Tandai Konsultasi Selesai"
        @update:visible="showSelesaiDialog = $event"
      >
        <div class="flex flex-col gap-4">
          <p class="body-b7 text-neutral-600">
            Isi ringkasan hasil konsultasi dengan
            <span class="font-semibold text-general-black">{{ bookingToAct?.nama_siswa }}</span>
            sebagai tindak lanjut.
          </p>
          <div class="p-3 rounded-lg bg-general-frame border border-general-border flex flex-col gap-1 body-b8">
            <div class="flex gap-3">
              <span class="text-neutral-500 w-24">Tanggal</span>
              <span class="font-semibold text-general-black">{{ fmtTanggal(bookingToAct?.tanggal_konsultasi ?? '') }}</span>
            </div>
            <div class="flex gap-3">
              <span class="text-neutral-500 w-24">Waktu</span>
              <span class="font-semibold text-general-black">{{ bookingToAct?.waktu_mulai }} – {{ bookingToAct?.waktu_selesai }}</span>
            </div>
          </div>
          <STextField
            label="Catatan Hasil Konsultasi"
            variant="textarea"
            v-model="catatanHasil"
            placeholder="Tuliskan ringkasan, tindak lanjut, atau rekomendasi dari hasil konsultasi..."
            required
          />
          <div class="flex justify-between items-start -mt-2">
            <p v-if="catatanHasil.trim().length > 0 && (catatanHasil.trim().length < 10 || catatanHasil.trim().length > 500)" class="body-b8 text-red-500">
              Catatan harus 10-500 karakter.
            </p>
            <div v-else></div>
            <p class="body-b8 text-neutral-500" :class="{ 'text-red-500': catatanHasil.length > 500 }">{{ catatanHasil.length }}/500</p>
          </div>
        </div>
        <template #actions>
          <SButton label="Batal" variant="secondary" size="medium" @click="showSelesaiDialog = false" />
          <SButton
            label="Simpan & Tandai Selesai"
            variant="primary"
            size="medium"
            :disabled="catatanHasil.trim().length < 10 || catatanHasil.trim().length > 500"
            @click="confirmSelesai"
          />
        </template>
      </SDialog>

      <!-- ── Dialog: Tidak Hadir ────────────────────────────────────────────── -->
      <SDialog
        :visible="showTidakHadirDialog"
        title="Tandai Tidak Hadir"
        variant="danger"
        @update:visible="showTidakHadirDialog = $event"
      >
        <div class="flex flex-col gap-4">
          <p class="body-b7 text-neutral-600">
            Apakah kamu yakin ingin menandai
            <span class="font-semibold text-general-black">{{ bookingToAct?.nama_siswa }}</span>
            sebagai <span class="font-semibold text-red-600">tidak hadir</span>?
          </p>
          <div class="p-3 rounded-lg bg-general-frame border border-general-border flex flex-col gap-1 body-b8">
            <div class="flex gap-3">
              <span class="text-neutral-500 w-24">Tanggal</span>
              <span class="font-semibold text-general-black">{{ fmtTanggal(bookingToAct?.tanggal_konsultasi ?? '') }}</span>
            </div>
            <div class="flex gap-3">
              <span class="text-neutral-500 w-24">Waktu</span>
              <span class="font-semibold text-general-black">{{ bookingToAct?.waktu_mulai }} – {{ bookingToAct?.waktu_selesai }}</span>
            </div>
          </div>
          <p class="body-b8 text-neutral-500">
            Status booking akan berubah menjadi "Tidak Hadir". Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <template #actions>
          <SButton label="Batal" variant="secondary" size="medium" @click="showTidakHadirDialog = false" />
          <SButton
            label="Ya, Tidak Hadir"
            variant="danger"
            size="medium"
            @click="confirmTidakHadir"
          />
        </template>
      </SDialog>

      <!-- Feedback Modals -->
      <SModal
        :visible="showSuccessModal"
        title="Berhasil!"
        @update:visible="(v) => { showSuccessModal = v }"
      >
        <div class="text-center text-lg font-semibold text-blue-700 py-2">{{ feedbackMessage }}</div>
      </SModal>

      <SModal
        :visible="showErrorModal"
        title="Terjadi Kesalahan"
        @update:visible="(v) => { showErrorModal = v }"
      >
        <div class="text-center text-base font-semibold text-red-600 py-2">{{ feedbackMessage }}</div>
      </SModal>

    </div>
  </div>
</template>

<style scoped>
* { font-family: "Be Vietnam Pro", sans-serif; }

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
  cursor: pointer;
  border: none;
  flex-shrink: 0;
}
.tab-btn--active {
  background: var(--color-blue-600);
  color: white;
  box-shadow: 0 2px 8px rgba(46, 48, 148, 0.25);
}
.tab-btn--inactive {
  background: white;
  color: var(--color-neutral-500);
  border: 1px solid var(--color-general-border);
}
.tab-btn--inactive:hover { background: var(--color-neutral-50); }

.tab-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
  line-height: 1.4;
}
.tab-badge--active  { background: rgba(255,255,255,.25); color: white; }
.tab-badge--inactive { background: var(--color-neutral-100); color: var(--color-neutral-500); }

.filters-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: stretch;
}
.filter-search { flex: 1; min-width: 0; }
.filter-extras { display: flex; gap: 12px; }

.filter-input {
  border: 1px solid var(--color-general-border);
  border-radius: 8px;
  padding: 10px 40px 10px 14px;
  height: 48px;
  font-size: 14px;
  color: var(--color-general-black);
  background: white;
  transition: border-color 0.2s;
  min-width: 140px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
.filter-input:focus {
  outline: none;
  border-color: var(--color-blue-500);
  box-shadow: 0 0 0 3px rgba(46,48,148,.08);
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-search,
  .filter-extras { width: 100%; }
  .filter-extras {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .filter-input { width: 100%; min-width: 0; }
}
</style>
