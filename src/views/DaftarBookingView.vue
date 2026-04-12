<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SChip from '@/components/SChip.vue'
import SDialog from '@/components/SDialog.vue'
import STextField from '@/components/STextField.vue'
import SDatePicker from '@/components/SDatePicker.vue'
import { useKonsultasiStore, type BookingKonsultasi } from '@/stores/konsultasi'
import { useAuthStore } from '@/stores/auth'

// ─── Store & Auth ─────────────────────────────────────────────────────────────

const store = useKonsultasiStore()
const authStore = useAuthStore()
const isGuruBK = computed(() => authStore.user?.role === 'guru_bk')

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
]

// ─── Detail Dialog ────────────────────────────────────────────────────────────

const showDetailDialog = ref(false)
const selectedBooking = ref<BookingKonsultasi | null>(null)

function openDetail(booking: BookingKonsultasi) {
  selectedBooking.value = booking
  showDetailDialog.value = true
}

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

const tableColumns = computed(() => {
  const cols = [
    { key: 'tanggal_konsultasi', label: 'Tanggal' },
    { key: 'waktu', label: 'Waktu' },
    { key: 'deskripsi', label: 'Alasan Konsultasi' },
    { key: 'status', label: 'Status' },
    { key: 'aksi', label: '' },
  ]
  if (isGuruBK.value) {
    cols.splice(1, 0, { key: 'nama_siswa', label: 'Nama Siswa' })
  }
  return cols
})

// ─── Chip helper ──────────────────────────────────────────────────────────────

function chipTone(status: string) {
  if (status === 'tersedia') return 'success'
  if (status === 'menunggu_konfirmasi') return 'warning'
  if (status === 'dikonfirmasi') return 'info'
  return 'danger'
}

function chipLabel(status: string) {
  const map: Record<string, string> = {
    menunggu_konfirmasi: 'Menunggu Konfirmasi',
    dikonfirmasi: 'Dikonfirmasi',
    ditolak: 'Ditolak',
    dibatalkan_siswa: 'Dibatalkan Siswa',
    dibatalkan_guru_bk: 'Dibatalkan Guru BK',
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
            <div v-if="showDatePicker" class="absolute right-0 top-[52px] z-50 shadow-xl border rounded-2xl overflow-hidden scale-90 origin-top-right">
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

      <!-- Empty state -->
      <div v-if="filteredBookings.length === 0" class="flex flex-col items-center justify-center py-12 text-center gap-2">
        <p class="body-b7 text-neutral-500">Tidak ada data booking ditemukan.</p>
        <p class="body-b8 text-neutral-400">
          {{ filterTanggal || filterStatus || search ? 'Coba ubah filter pencarian.' : 'Belum ada booking yang dibuat.' }}
        </p>
      </div>

      <!-- Tabel -->
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
              v-for="booking in filteredBookings"
              :key="booking.id"
              class="hover:bg-general-frame transition-colors"
            >

              <!-- Nama Siswa (hanya Guru BK) -->
              <td v-if="isGuruBK" class="px-5 py-4">
                <span class="body-b7 text-general-black">{{ booking.nama_siswa }}</span>
              </td>

              <!-- Tanggal -->
              <td class="px-5 py-4">
                <span class="body-b7 text-general-black">{{ fmtTanggal(booking.tanggal_konsultasi) }}</span>
              </td>

              <!-- Waktu -->
              <td class="px-5 py-4">
                <span class="body-b7 text-general-black">{{ booking.waktu_mulai }} – {{ booking.waktu_selesai }}</span>
              </td>

              <!-- Alasan -->
              <td class="px-5 py-4 max-w-[200px]">
                <p class="body-b8 text-neutral-600 truncate">{{ booking.deskripsi }}</p>
              </td>

              <!-- Status -->
              <td class="px-5 py-4">
                <SChip :label="chipLabel(booking.status)" :tone="chipTone(booking.status)" size="medium" />
              </td>

              <!-- Aksi -->
              <td class="px-5 py-4">
                <SButton label="Detail" variant="action" size="small" @click="openDetail(booking)">
                  <template #left-icon>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </template>
                </SButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SCard>

    <!-- ── Dialog: Detail Booking ─────────────────────────────────────────── -->
    <SDialog :visible="showDetailDialog" title="Detail Booking" @update:visible="showDetailDialog = $event">
      <div v-if="selectedBooking" class="flex flex-col gap-4">

        <div class="grid gap-2 body-b7">

          <div v-if="isGuruBK" class="flex gap-4 py-2 border-b border-general-border">
            <span class="text-neutral-500 w-32 shrink-0">Nama Siswa</span>
            <span class="text-general-black font-semibold">{{ selectedBooking.nama_siswa }}</span>
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

          <div class="flex gap-4 py-2">
            <span class="text-neutral-500 w-32 shrink-0">Dibuat pada</span>
            <span class="text-neutral-500 body-b8">{{ new Date(selectedBooking.dibuat_pada).toLocaleString('id-ID') }}</span>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <SButton label="Tutup" variant="tertiary" size="medium" @click="showDetailDialog = false" />
        </div>
      </div>
    </SDialog>

    </div>
  </div>
</template>

<style scoped>
* { font-family: "Be Vietnam Pro", sans-serif; }

/* ─── Tabs (sama persis laporan bullying) ─── */
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

/* ─── Filter row ─── */
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

/* ─── Mobile ─── */
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
