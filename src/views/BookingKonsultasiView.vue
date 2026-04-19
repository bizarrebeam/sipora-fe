<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import STextField from '@/components/STextField.vue'
import SChip from '@/components/SChip.vue'
import SDialog from '@/components/SDialog.vue'
import SModal from '@/components/SModal.vue'
import { RouterLink } from 'vue-router'
import { useKonsultasiStore, type JadwalKonsultasi } from '@/stores/konsultasi'
import { apiAuthGet } from '@/services/api'
import { useNotFoundStore } from '@/stores/notFound'

const store = useKonsultasiStore()
const notFoundStore = useNotFoundStore()
const DAILY_BOOKING_LIMIT = 2

const today = new Date()
const viewMonth = ref(today.getMonth())
const viewYear = ref(today.getFullYear())
const selectedDate = ref<string | null>(null)
const nowMs = ref(Date.now())
let nowTicker: ReturnType<typeof setInterval> | null = null

// Available slots (status === 'tersedia') for the selected date.
const availableSlots = ref<JadwalKonsultasi[]>([])
const loadingSlots = ref(false)

// Booking dialogs and related form state.
const showBookingDialog = ref(false)
const showConfirmDialog = ref(false)
const selectedSlot = ref<JadwalKonsultasi | null>(null)
const deskripsi = ref('')
const bookingError = ref<string | null>(null)
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const feedbackMessage = ref('')

watch(() => store.successMessage, (message) => {
  if (!message) return
  feedbackMessage.value = message
  showSuccessModal.value = true
})

watch(() => store.errorMessage, (message) => {
  if (!message) return
  feedbackMessage.value = message
  showErrorModal.value = true
})

// ─── Calendar ─────────────────────────────────────────────────────────────────

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const DAYS = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']

const monthLabel = computed(() => `${MONTHS[viewMonth.value]} ${viewYear.value}`)

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const days: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
})

function fmtDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const todayStr = fmtDate(today.getFullYear(), today.getMonth(), today.getDate())

function isPast(d: number) {
  return fmtDate(viewYear.value, viewMonth.value, d) < todayStr
}

function isFutureLimit(d: number) {
  const limitDate = new Date(today);
  limitDate.setDate(limitDate.getDate() + 30);
  const limitStr = fmtDate(limitDate.getFullYear(), limitDate.getMonth(), limitDate.getDate());
  return fmtDate(viewYear.value, viewMonth.value, d) > limitStr;
}

function isToday(d: number) {
  return fmtDate(viewYear.value, viewMonth.value, d) === todayStr
}

function isSelected(d: number) {
  return fmtDate(viewYear.value, viewMonth.value, d) === selectedDate.value
}

/**
 * Determines whether a slot is expired based on the slot start time.
 */
function isSlotExpired(slot: JadwalKonsultasi) {
  const raw = slot.waktu_mulai || ''
  const hhmm = raw.slice(0, 5)
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return false

  const start = new Date(`${slot.tanggal}T${hhmm}:00`)
  if (Number.isNaN(start.getTime())) return false

  return start.getTime() < nowMs.value
}

function slotChipLabel(slot: JadwalKonsultasi) {
  return isSlotExpired(slot) ? 'Out of Date' : 'Tersedia'
}

function slotChipTone(slot: JadwalKonsultasi) {
  return isSlotExpired(slot) ? 'danger' : 'success'
}

/**
 * Returns date-only string (YYYY-MM-DD) from a full date-time value.
 */
function normalizeDateOnly(value: string) {
  return (value || '').split('T')[0] || ''
}

const activeBookingCountOnSelectedDate = computed(() => {
  if (!selectedDate.value) return 0
  const ignoredStatuses = new Set(['ditolak', 'dibatalkan_siswa', 'dibatalkan_guru_bk'])
  return store.daftarBooking.filter((b) => {
    return normalizeDateOnly(b.tanggal_konsultasi) === selectedDate.value && !ignoredStatuses.has(b.status)
  }).length
})

const hasReachedDailyBookingLimit = computed(() => activeBookingCountOnSelectedDate.value >= DAILY_BOOKING_LIMIT)

// Cache for dates that currently have available slots.
const datesWithAvailableSlots = ref<Set<string>>(new Set())

async function fetchAvailableDates() {
  try {
    const result = await apiAuthGet('konsultasi/jadwal/')
    const payload = (result && typeof result === 'object' && 'data' in result)
      ? (result as { data?: unknown }).data
      : result
    const jadwals = (payload as JadwalKonsultasi[]) ?? []
    const available = jadwals.filter(j => j.status === 'tersedia').map(j => j.tanggal)
    datesWithAvailableSlots.value = new Set(available)
  } catch {
    // For students, backend can reject this endpoint; keep UI calm without global 404 popup.
    notFoundStore.hide()
  }
}

function hasAvailableSlot(d: number) {
  return datesWithAvailableSlots.value.has(fmtDate(viewYear.value, viewMonth.value, d))
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

async function selectDate(d: number) {
  if (isPast(d) || isFutureLimit(d)) return
  selectedDate.value = fmtDate(viewYear.value, viewMonth.value, d)
  await loadSlotsForDate(selectedDate.value)
  await store.ambilBooking()
}

async function loadSlotsForDate(date: string) {
  loadingSlots.value = true
  try {
    const result = await apiAuthGet(`konsultasi/jadwal/?tanggal=${date}`)
    const payload = (result && typeof result === 'object' && 'data' in result)
      ? (result as { data?: unknown }).data
      : result
    const all = (payload as JadwalKonsultasi[]) ?? []
    availableSlots.value = all.filter(j => j.status === 'tersedia')
  } catch {
    notFoundStore.hide()
    availableSlots.value = []
  } finally {
    loadingSlots.value = false
  }
}

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return null
  const parts = selectedDate.value.split('-').map(Number)
  if (parts.length !== 3) return selectedDate.value
  const [y, m, d] = parts as [number, number, number]
  if (
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d) ||
    m < 1 ||
    m > 12
  ) {
    return selectedDate.value
  }
  const dateObj = new Date(y, m - 1, d)
  const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
  return `${dayNames[dateObj.getDay()]}, ${d} ${MONTHS[m - 1]} ${y}`
})

// ─── Booking Logic ────────────────────────────────────────────────────────────

function openBooking(slot: JadwalKonsultasi) {
  if (isSlotExpired(slot) || hasReachedDailyBookingLimit.value) return
  selectedSlot.value = slot
  deskripsi.value = ''
  bookingError.value = null
  showBookingDialog.value = true
}

const isFormValid = computed(() => {
  const len = deskripsi.value.trim().length
  return len >= 20 && len <= 150
})

function proceedToConfirm() {
  if (!isFormValid.value) return
  showBookingDialog.value = false
  showConfirmDialog.value = true
}

async function confirmBooking() {
  if (!selectedSlot.value) return
  if (hasReachedDailyBookingLimit.value) {
    bookingError.value = `Kamu sudah mencapai batas booking ${DAILY_BOOKING_LIMIT} kali pada tanggal ini.`
    showConfirmDialog.value = false
    showBookingDialog.value = true
    return
  }
  bookingError.value = null

  const ok = await store.buatBooking({
    jadwal: selectedSlot.value.id,
    deskripsi: deskripsi.value.trim(),
  })

  if (ok) {
    showConfirmDialog.value = false
    selectedSlot.value = null
    deskripsi.value = ''
    // Refresh slot list so newly booked slot no longer appears as available.
    if (selectedDate.value) await loadSlotsForDate(selectedDate.value)
    await fetchAvailableDates()
    await store.ambilBooking()
  } else {
    bookingError.value = store.errorMessage
    showConfirmDialog.value = false
    showBookingDialog.value = true
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
  nowTicker = setInterval(() => {
    nowMs.value = Date.now()
  }, 30000)
  await fetchAvailableDates()
})

onBeforeUnmount(() => {
  if (nowTicker) clearInterval(nowTicker)
})
</script>

<template>
  <div class="stf-page">

    <div class="stf-container">
      <div class="stf-header">
				<div class="stf-header-text">
					<h1 class="stf-page-title">Booking Konsultasi BK</h1>
					<p class="stf-page-subtitle">
						Pilih tanggal dan slot waktu yang tersedia untuk konsultasi.
					</p>
				</div>
        <RouterLink to="/daftar-booking-konsultasi">
          <SButton label="Lihat Daftar Booking" variant="primary" />
        </RouterLink>
			</div>

    <!-- Layout -->
    <div class="flex flex-col lg:flex-row gap-6 items-start">

      <!-- Calendar -->
      <SCard padding="20px" class="w-full lg:w-[300px] shrink-0">
        <div class="flex items-center justify-between mb-4">
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-general-border text-neutral-500 hover:bg-general-frame transition-colors"
            @click="prevMonth"
          >&#8249;</button>
          <span class="subheading-s7 text-general-black">{{ monthLabel }}</span>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-general-border text-blue-500 hover:bg-blue-50 transition-colors"
            @click="nextMonth"
          >&#8250;</button>
        </div>

        <div class="grid grid-cols-7 gap-0.5">
          <div v-for="day in DAYS" :key="day" class="text-center body-b8 text-neutral-400 uppercase py-1">{{ day }}</div>

          <template v-for="(d, i) in calendarDays" :key="i">
            <div
              class="relative flex items-center justify-center h-9 rounded-lg text-sm cursor-pointer transition-colors select-none"
              :class="{
                'opacity-0 pointer-events-none': d === null,
                'text-neutral-300 cursor-default': d && (isPast(d) || isFutureLimit(d)),
                'bg-blue-500 text-white font-semibold': d && isSelected(d),
                'text-general-black hover:bg-general-frame': d && !isPast(d) && !isFutureLimit(d) && !isSelected(d),
                'font-semibold': d && isToday(d),
              }"
              @click="d && !isPast(d) && !isFutureLimit(d) && selectDate(d)"
            >
              {{ d }}
              <span v-if="d && isToday(d)" class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" :class="isSelected(d) ? 'bg-white' : 'bg-blue-500'" />
              <span v-if="d && hasAvailableSlot(d) && !isPast(d)" class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" :class="isSelected(d) ? 'bg-white' : 'bg-green-400'" />
            </div>
          </template>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 mt-4 pt-3 border-t border-general-border">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            <span class="body-b8 text-neutral-500">Ada slot</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            <span class="body-b8 text-neutral-500">Hari ini</span>
          </div>
        </div>
      </SCard>

      <!-- Slot panel -->
      <div class="w-full lg:flex-1">
        <SCard v-if="!selectedDate" padding="32px">
          <div class="flex flex-col items-center justify-center py-8 text-center gap-2">
            <p class="subheading-s7 text-general-black">Pilih tanggal konsultasi</p>
            <p class="body-b8 text-neutral-500">Klik tanggal yang memiliki titik hijau untuk melihat slot yang tersedia.</p>
          </div>
        </SCard>

        <template v-else>
          <div class="mb-4">
            <p class="subheading-s7 text-general-black">{{ selectedDateLabel }}</p>
            <p class="body-b8 text-neutral-500 mt-0.5">Pilih slot waktu di bawah untuk booking</p>
            <p v-if="hasReachedDailyBookingLimit" class="body-b8 text-red-600 mt-1">
              Kamu sudah mencapai batas booking {{ DAILY_BOOKING_LIMIT }} kali pada tanggal ini.
            </p>
          </div>

          <SCard padding="0px">
            <div v-if="loadingSlots" class="flex items-center justify-center py-10">
              <p class="body-b8 text-neutral-400">Memuat slot...</p>
            </div>

            <div v-else-if="availableSlots.length === 0" class="flex flex-col items-center justify-center py-10 text-center gap-1">
              <p class="body-b7 text-neutral-500">Tidak ada slot tersedia pada tanggal ini.</p>
              <p class="body-b8 text-neutral-400">Coba pilih tanggal lain.</p>
            </div>

            <div v-else class="divide-y divide-general-border">
              <div
                v-for="slot in availableSlots"
                :key="slot.id"
                class="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4"
              >
                <div class="flex-1">
                  <p class="subheading-s8 text-general-black">{{ slot.waktu_mulai }} – {{ slot.waktu_selesai }}</p>
                  <p class="body-b8 text-neutral-400 mt-0.5">{{ slot.nama_guru_bk }}</p>
                  <p v-if="slot.catatan" class="body-b8 text-neutral-400">{{ slot.catatan }}</p>
                </div>
                <SChip :label="slotChipLabel(slot)" :tone="slotChipTone(slot)" size="medium" />
                <SButton
                  label="Pesan Slot Ini"
                  variant="primary"
                  size="medium"
                  :disabled="isSlotExpired(slot) || hasReachedDailyBookingLimit"
                  @click="openBooking(slot)"
                />
              </div>
            </div>
          </SCard>
        </template>
      </div>
    </div>

    <!-- ── Dialog: Form Booking ───────────────────────────────────────────── -->
    <SDialog :visible="showBookingDialog" title="Detail Booking" @update:visible="showBookingDialog = $event">
      <div class="flex flex-col gap-4">
        <div v-if="bookingError" class="p-3 rounded-lg bg-red-50 border border-red-200 body-b8 text-red-700">
          {{ bookingError }}
        </div>

        <div class="p-3 rounded-lg bg-general-frame border border-general-border body-b8">
          <p class="text-neutral-500">Slot dipilih</p>
          <p class="subheading-s8 text-general-black mt-0.5">
            {{ selectedSlot?.waktu_mulai }} – {{ selectedSlot?.waktu_selesai }}
          </p>
          <p class="text-neutral-500 mt-0.5">{{ selectedDateLabel }}</p>
        </div>

        <STextField
          label="Alasan Konsultasi"
          variant="textarea"
          v-model="deskripsi"
          placeholder="Ceritakan secara singkat alasan kamu ingin berkonsultasi..."
          required
        />
        <div class="flex justify-between items-start -mt-2">
          <p v-if="deskripsi.trim().length > 0 && !isFormValid" class="body-b8 text-red-500">
            Alasan konsultasi max 20-150 char
          </p>
          <div v-else></div>
          <p class="body-b8 text-neutral-500" :class="{ 'text-red-500': deskripsi.length > 150 }">
            {{ deskripsi.length }}/150
          </p>
        </div>
      </div>

      <template #actions>
        <SButton label="Batal" variant="secondary" size="medium" @click="showBookingDialog = false" />
        <SButton
          label="Lanjut"
          variant="primary"
          size="medium"
          :disabled="!isFormValid"
          @click="proceedToConfirm"
        />
      </template>
    </SDialog>

    <!-- ── Dialog: Konfirmasi Booking ────────────────────────────────────── -->
     <SDialog
      :visible="showConfirmDialog"
      title="Konfirmasi Booking"
      @update:visible="showConfirmDialog = $event"
    >
      <div class="flex flex-col gap-4">
        <p class="body-b7 text-neutral-600">Apakah kamu yakin ingin memesan slot ini?</p>

        <div class="p-3 rounded-lg bg-general-frame border border-general-border flex flex-col gap-1 body-b8">
          <div class="flex gap-3">
            <span class="text-neutral-500 w-24">Tanggal</span>
            <span class="text-general-black font-semibold">{{ selectedDateLabel }}</span>
          </div>
          <div class="flex gap-3">
            <span class="text-neutral-500 w-24">Waktu</span>
            <span class="text-general-black font-semibold">{{ selectedSlot?.waktu_mulai }} – {{ selectedSlot?.waktu_selesai }}</span>
          </div>
          <div class="flex gap-3">
            <span class="text-neutral-500 w-24">Alasan</span>
            <span class="text-general-black">{{ deskripsi }}</span>
          </div>
        </div>
      </div>

      <template #actions>
        <SButton
          label="Kembali"
          variant="secondary"
          size="medium"
          @click="showConfirmDialog = false; showBookingDialog = true"
        />
        <SButton
          label="Ya, Booking Sekarang"
          variant="primary"
          size="medium"
          @click="confirmBooking"
        />
      </template>
    </SDialog>

    </div>

    <SModal
      :visible="showSuccessModal"
      title="Berhasil!"
      @update:visible="(v) => { showSuccessModal = v; if (!v) store.clearMessages() }"
    >
      <div class="text-center text-lg font-semibold text-blue-700 py-2">{{ feedbackMessage }}</div>
    </SModal>

    <SModal
      :visible="showErrorModal"
      title="Terjadi Kesalahan"
      @update:visible="(v) => { showErrorModal = v; if (!v) store.clearMessages() }"
    >
      <div class="text-center text-base font-semibold text-red-600 py-2">{{ feedbackMessage }}</div>
    </SModal>

  </div>
</template>
