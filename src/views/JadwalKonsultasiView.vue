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

// ─── State ────────────────────────────────────────────────────────────────────

const store = useKonsultasiStore()

const today = new Date()
const viewMonth = ref(today.getMonth())
const viewYear = ref(today.getFullYear())
const selectedDate = ref<string | null>(null)
const nowMs = ref(Date.now())
let nowTicker: ReturnType<typeof setInterval> | null = null

const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editingSlot = ref<JadwalKonsultasi | null>(null)
const deletingSlot = ref<JadwalKonsultasi | null>(null)

const formStart = ref('08:00')
const formEnd = ref('09:00')
const formCatatan = ref('')
const formError = ref<string | null>(null)
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

// ─── Calendar Logic ───────────────────────────────────────────────────────────

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
  const limit = new Date(today)
  limit.setDate(limit.getDate() + 30)
  const limitStr = fmtDate(limit.getFullYear(), limit.getMonth(), limit.getDate())
  return fmtDate(viewYear.value, viewMonth.value, d) > limitStr
}

function isToday(d: number) {
  return fmtDate(viewYear.value, viewMonth.value, d) === todayStr
}

function isSelected(d: number) {
  return fmtDate(viewYear.value, viewMonth.value, d) === selectedDate.value
}

const datesWithSlots = computed(() => {
  const dates = new Set<string>()
  store.daftarJadwal.forEach(j => dates.add(j.tanggal))
  return dates
})

function hasSlot(d: number) {
  return datesWithSlots.value.has(fmtDate(viewYear.value, viewMonth.value, d))
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
  await store.ambilJadwal()
}

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return null
  const parts = selectedDate.value.split('-').map(Number)
  if (parts.length !== 3) return selectedDate.value
  const [y, m, d] = parts as [number, number, number]
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d) || m < 1 || m > 12) {
    return selectedDate.value
  }
  const dateObj = new Date(y, m - 1, d)
  const dayNames = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
  return `${dayNames[dateObj.getDay()]}, ${d} ${MONTHS[m - 1]} ${y}`
})

const slotsForSelectedDate = computed(() =>
  selectedDate.value
    ? store.daftarJadwal.filter(j => j.tanggal === selectedDate.value)
    : []
)

// ─── Form Dialog ──────────────────────────────────────────────────────────────

function openAddForm() {
  editingSlot.value = null
  formStart.value = '08:00'
  formEnd.value = '09:00'
  formCatatan.value = ''
  formError.value = null
  showFormDialog.value = true
}

function openEditForm(slot: JadwalKonsultasi) {
  if (isSlotExpired(slot)) return
  editingSlot.value = slot
  formStart.value = slot.waktu_mulai
  formEnd.value = slot.waktu_selesai
  formCatatan.value = slot.catatan ?? ''
  formError.value = null
  showFormDialog.value = true
}

const isFormValid = computed(() => formStart.value && formEnd.value && formStart.value < formEnd.value)

async function submitForm() {
  if (!isFormValid.value || !selectedDate.value) return
  formError.value = null

  let ok: boolean
  if (editingSlot.value) {
    ok = await store.editJadwal(editingSlot.value.id, {
      waktu_mulai: formStart.value,
      waktu_selesai: formEnd.value,
      catatan: formCatatan.value || undefined,
    }, selectedDate.value)
  } else {
    ok = await store.buatJadwal({
      tanggal: selectedDate.value,
      waktu_mulai: formStart.value,
      waktu_selesai: formEnd.value,
      catatan: formCatatan.value || undefined,
    })
  }

  if (ok) {
    showFormDialog.value = false
  } else {
    formError.value = store.errorMessage
  }
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function openDeleteDialog(slot: JadwalKonsultasi) {
  if (isSlotExpired(slot)) return
  deletingSlot.value = slot
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingSlot.value || !selectedDate.value) return
  const ok = await store.hapusJadwal(deletingSlot.value.id, selectedDate.value)
  if (ok) {
    showDeleteDialog.value = false
  }
}

// ─── Chip helper ──────────────────────────────────────────────────────────────

function chipTone(status: string) {
  if (status === 'tersedia') return 'success'
  if (status === 'menunggu_konfirmasi') return 'warning'
  if (status === 'dikonfirmasi') return 'info'
  return 'danger'
}

function chipLabel(status: string) {
  const map: Record<string, string> = {
    tersedia: 'Tersedia',
    menunggu_konfirmasi: 'Menunggu Konfirmasi',
    dikonfirmasi: 'Dikonfirmasi',
    ditolak: 'Ditolak',
    dibatalkan_siswa: 'Dibatalkan Siswa',
    dibatalkan_guru_bk: 'Dibatalkan Guru BK',
  }
  return map[status] ?? status
}

function isSlotExpired(slot: JadwalKonsultasi) {
  const datePart = (slot.tanggal || '').split('T')[0] || ''
  const rawTime = slot.waktu_mulai || ''
  const hhmm = rawTime.slice(0, 5)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart) || !/^\d{2}:\d{2}$/.test(hhmm)) {
    return false
  }

  const slotStartMs = new Date(`${datePart}T${hhmm}:00`).getTime()
  if (Number.isNaN(slotStartMs)) return false

  return slotStartMs <= nowMs.value
}

function slotChipLabel(slot: JadwalKonsultasi) {
  return isSlotExpired(slot) ? 'Out of Date' : chipLabel(slot.status)
}

function slotChipTone(slot: JadwalKonsultasi) {
  return isSlotExpired(slot) ? 'danger' : chipTone(slot.status)
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(async () => {
  nowTicker = setInterval(() => {
    nowMs.value = Date.now()
  }, 30000)
  await store.ambilJadwal()
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
					<h1 class="stf-page-title">Jadwal Konsultasi</h1>
					<p class="stf-page-subtitle">
						Kelola slot ketersediaanmu untuk konsultasi siswa.
					</p>
				</div>
        <RouterLink to="/daftar-booking-konsultasi">
          <SButton label="Lihat Daftar Booking" variant="primary" />
        </RouterLink>
			</div>

    <!-- Layout: Kalender + Panel -->
    <div class="flex flex-col lg:flex-row gap-6 items-start">

      <!-- Kalender -->
      <SCard padding="20px" class="w-full lg:w-[300px] shrink-0">
        <!-- Navigasi bulan -->
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

        <!-- Grid hari -->
        <div class="grid grid-cols-7 gap-0.5">
          <div v-for="day in DAYS" :key="day" class="text-center body-b8 text-neutral-400 uppercase py-1">
            {{ day }}
          </div>

          <template v-for="(d, i) in calendarDays" :key="i">
            <div
              class="relative flex items-center justify-center h-9 rounded-lg text-sm cursor-pointer transition-colors select-none"
              :title="d && isFutureLimit(d) ? 'Maksimal pembuatan jadwal 1 bulan ke depan' : ''"
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
              <!-- Dot hari ini -->
              <span
                v-if="d && isToday(d)"
                class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                :class="isSelected(d) ? 'bg-white' : 'bg-blue-500'"
              />
              <!-- Dot ada slot -->
              <span
                v-if="d && hasSlot(d) && !isPast(d)"
                class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                :class="isSelected(d) ? 'bg-white' : 'bg-green-400'"
              />
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

      <!-- Panel Kanan -->
      <div class="w-full lg:flex-1 flex flex-col gap-4">

        <!-- Pilih tanggal dulu -->
        <SCard v-if="!selectedDate" padding="32px">
          <div class="flex flex-col items-center justify-center py-6 text-center gap-2">
            <p class="subheading-s7 text-general-black">Pilih tanggal</p>
            <p class="body-b8 text-neutral-500">Klik tanggal di kalender untuk melihat dan mengelola slot jadwal.</p>
          </div>
        </SCard>

        <template v-else>
          <!-- Header panel + tombol tambah -->
          <div class="flex items-center justify-between">
            <div>
              <p class="subheading-s7 text-general-black">{{ selectedDateLabel }}</p>
              <p class="body-b8 text-neutral-500 mt-0.5">{{ slotsForSelectedDate.length }} slot terdaftar</p>
            </div>
            <SButton label="+ Tambah Slot" variant="primary" size="medium" @click="openAddForm" />
          </div>

          <!-- Daftar slot -->
          <SCard padding="0px">
            <div v-if="slotsForSelectedDate.length === 0" class="flex flex-col items-center justify-center py-10 text-center gap-2">
              <p class="body-b7 text-neutral-500">Tidak ada jadwal pada tanggal ini.</p>
              <p class="body-b8 text-neutral-400">Tambahkan slot baru menggunakan tombol di atas.</p>
            </div>

            <div v-else class="divide-y divide-general-border">
              <div
                v-for="slot in slotsForSelectedDate"
                :key="slot.id"
                class="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4"
              >
                <!-- Waktu -->
                <div class="min-w-[120px]">
                  <p class="subheading-s8 text-general-black">{{ slot.waktu_mulai }} – {{ slot.waktu_selesai }}</p>
                  <p v-if="slot.catatan" class="body-b8 text-neutral-400 mt-0.5">{{ slot.catatan }}</p>
                </div>

                <!-- Status chip -->
                <SChip :label="slotChipLabel(slot)" :tone="slotChipTone(slot)" size="medium" />

                <!-- Info siswa jika booked -->
                <div v-if="slot.is_booked" class="flex-1">
                  <p class="body-b8 text-neutral-500">Dipesan oleh siswa</p>
                </div>
                <div v-else class="flex-1" />

                <!-- Actions -->
                <div class="flex items-center gap-2">
                  <template v-if="!slot.is_booked">
                    <SButton label="Edit" variant="secondary" size="small" :disabled="isSlotExpired(slot)" @click="openEditForm(slot)" />
                    <SButton label="Hapus" variant="danger" size="small" :disabled="isSlotExpired(slot)" @click="openDeleteDialog(slot)" />
                  </template>
                </div>
              </div>
            </div>
          </SCard>
        </template>
      </div>
    </div>

    <!-- ── Dialog: Tambah/Edit Slot ───────────────────────────────────────── -->
     <SDialog :visible="showFormDialog" :title="editingSlot ? 'Edit Slot Jadwal' : 'Tambah Slot Jadwal'" @update:visible="showFormDialog = $event">
      <div class="flex flex-col gap-4">
        <div v-if="formError" class="p-3 rounded-lg bg-red-50 border border-red-200 body-b8 text-red-700">
          {{ formError }}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <STextField label="Waktu Mulai" type="time" v-model="formStart" required />
          <STextField label="Waktu Selesai" type="time" v-model="formEnd" required />
        </div>

        <p v-if="formStart && formEnd && formStart >= formEnd" class="body-b8 text-red-500 -mt-2">
          Waktu mulai harus lebih kecil dari waktu selesai.
        </p>

        <STextField label="Catatan (opsional)" v-model="formCatatan" placeholder="Misal: sesi konsultasi akademik" />
      </div>

      <template #actions>
        <SButton
          label="Batal"
          variant="secondary"
          size="medium"
          @click="showFormDialog = false"
        />
        <SButton
          :label="editingSlot ? 'Simpan Perubahan' : 'Simpan Jadwal'"
          variant="primary"
          size="medium"
          :disabled="!isFormValid"
          @click="submitForm"
        />
      </template>
    </SDialog>

    <!-- ── Dialog: Konfirmasi Hapus ───────────────────────────────────────── -->
    <SDialog
      :visible="showDeleteDialog"
      variant="danger"
      title="Hapus Jadwal"
      @update:visible="showDeleteDialog = $event"
    >
      <div class="flex flex-col gap-4">
        <p class="body-b7 text-neutral-600">
          Apakah kamu yakin ingin menghapus slot
          <span class="font-semibold text-general-black">{{ deletingSlot?.waktu_mulai }} – {{ deletingSlot?.waktu_selesai }}</span>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </div>

      <template #actions>
        <div class="flex justify-end gap-3 w-full">
          <SButton label="Batal" variant="secondary" size="medium" @click="showDeleteDialog = false" />
          <SButton label="Ya, Hapus" variant="danger" size="medium" @click="confirmDelete" />
        </div>
      </template>
    </SDialog>

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
  </div>
</template>
