<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLaporanBullyingStore } from '@/stores/laporanBullying'
import { useTanggapanStore } from '@/stores/tanggapan'
import { useAlertStore } from '@/stores/alert'
import { useNotFoundStore } from '@/stores/notFound'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SDialog from '@/components/SDialog.vue'
import SChip from '@/components/SChip.vue'
import STanggapanThread from '@/components/STanggapanThread.vue'
import STanggapanForm from '@/components/STanggapanForm.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const laporanStore = useLaporanBullyingStore()
const tanggapanStore = useTanggapanStore()
const alertStore = useAlertStore()

const id = route.params.id as string
const loading = ref(true)

const laporan = computed(() => laporanStore.detailLaporan)
const isGuruBk = computed(() => authStore.user?.role === 'guru_bk')
const isKemahasiswaan = computed(() => authStore.user?.role === 'kemahasiswaan')
const isAdmin = computed(() => isGuruBk.value || isKemahasiswaan.value)
const isPelapor = computed(() => {
  const role = authStore.user?.role || ''
  const isPelaporRole = role === 'siswa' || role === 'guru'
  return isPelaporRole && laporan.value?.pelapor?.id === authStore.user?.id
})

const showBatalkanDialog = ref(false)
const showBuktiDialog = ref(false)
const alasanPembatalan = ref('')

// Status update dialog states
const showStatusDialog = ref(false)
const showStatusConfirmDialog = ref(false)
const selectedNewStatus = ref<string>('')
const showStatusOptions = ref(false)
const statusReason = ref('')
const statusNote = ref('')
const isUpdatingStatus = ref(false)
const isConfirmingCompletion = ref(false)
const showPelaporDecisionDialog = ref(false)
const pelaporDecision = ref<'setuju' | 'belum_selesai' | null>(null)
const pelaporApprovalReason = ref('')

async function fetchDetail() {
    loading.value = true
    try {
        await laporanStore.ambilDetail(id)
        // Fetch responses for this report
        await tanggapanStore.ambilTanggapan(id, 'bullying')
    } catch (error: any) {
    if (error?.name === 'ServerHandledError') {
      console.error('[DetailLaporanBullying] Request failed (handled globally):', error.message);
      return;
    }
        const errorMsg = String(error?.message || error)
        
        if (useNotFoundStore().visible || errorMsg.includes('403') || errorMsg.includes('Akses ditolak') || errorMsg.includes('Forbidden') || error?.response?.status === 403) {
            router.replace('/laporan-bullying')
            return
        }

        if (errorMsg.includes('401')) {
            router.push('/login')
        } else {
            alertStore.error('Gagal memuat detail laporan')
            router.push('/laporan-bullying')
        }
    } finally {
        loading.value = false
    }
}

onMounted(() => { fetchDetail() })

function formatDate(dateStr: string, includeTime = false) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    if (includeTime) {
        options.hour = '2-digit'
        options.minute = '2-digit'
    }
    return d.toLocaleDateString('id-ID', options).replace(' pukul ', ', ')
}

function formatTime(timeStr: string) {
    if (!timeStr) return '-'
    return timeStr.slice(0, 5)
}

function formatImageUrl(path: string | undefined): string {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '')
    if (path.startsWith('/media/')) return `${API_BASE}${path}`
    if (path.startsWith('/')) return `${API_BASE}/media${path}`
    return `${API_BASE}/media/${path}`
}

function statusLabel(status: string) {
    const map: Record<string, string> = {
        menunggu: 'Menunggu Konfirmasi',
        diproses: 'Diproses',
        menunggu_konfirmasi_selesai: 'Menunggu Konfirmasi Selesai',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
        ditolak: 'Ditolak'
    }
    if (map[status]) return map[status]
    return status.replace(/_/g, ' ')
}

function statusTone(status: string): 'warning' | 'info' | 'success' | 'danger' {
    if (status === 'menunggu') return 'warning'
    if (status === 'menunggu_konfirmasi_selesai') return 'warning'
    if (status === 'diproses') return 'info'
    if (status === 'selesai') return 'success'
    return 'danger'
}

function formatRiwayatCatatan(riwayat: { status: string; catatan?: string | null; user?: { nama_lengkap?: string; role?: string } | null }) {
    const namaPengubah = riwayat.user?.nama_lengkap || 'Sistem'
    const catatan = (riwayat.catatan || '').trim()
    
    if (catatan) {
        if (catatan.toLowerCase().includes(' oleh ')) return catatan
        return `${catatan} oleh ${namaPengubah}`
    }
    
    return `Laporan ${statusLabel(riwayat.status)} oleh ${namaPengubah}`
}

async function handleBatalkan() {
    if (!alasanPembatalan.value || alasanPembatalan.value.length < 50) {
        alertStore.error('Alasan pembatalan wajib diisi minimal 50 karakter')
        return
    }
    try {
        await laporanStore.batalkanLaporan(id, alasanPembatalan.value)
        alertStore.success('Laporan berhasil dibatalkan')
        showBatalkanDialog.value = false
        fetchDetail()
    } catch (error) {
    if (error?.name === 'ServerHandledError') {
      console.error('[DetailLaporanBullying] Request failed (handled globally):', error.message);
      return;
    }}
}

// Status update handlers
function getAvailableStatusOptions() {
    const currentStatus = laporan.value?.status
    const statusOptions: Record<string, { label: string; value: string }[]> = {
        menunggu: [
            { label: 'Diproses', value: 'diproses' },
            { label: 'Ditolak', value: 'ditolak' }
        ],
        diproses: [
            { label: 'Selesai', value: 'menunggu_konfirmasi_selesai' },
            { label: 'Ditolak', value: 'ditolak' }
        ],
        menunggu_konfirmasi_selesai: [],
    }
    return statusOptions[currentStatus || ''] || []
}

function openStatusDialog() {
    selectedNewStatus.value = ''
    showStatusOptions.value = false
    statusReason.value = ''
    statusNote.value = ''
    showStatusDialog.value = true
}

const selectedStatusOption = computed(() => {
    return getAvailableStatusOptions().find((opt) => opt.value === selectedNewStatus.value)
})

const tindakLanjutMessage = computed(() => {
  const status = laporan.value?.status || ''
  if (status === 'selesai') {
    return 'Status laporan ini tidak dapat diubah lagi karena laporan sudah ditutup (selesai).'
  }
  if (status === 'menunggu_konfirmasi_selesai') {
    return 'Status laporan ini tidak dapat diubah lagi karena laporan sedang menunggu konfirmasi persetujuan dari pelapor.'
  }
  if (status === 'dibatalkan') {
    return 'Status laporan ini tidak dapat diubah lagi karena sudah dibatalkan pelapor.'
  }
  return ''
})

function selectStatusOption(value: string) {
    selectedNewStatus.value = value
    showStatusOptions.value = false
}

function proceedToStatusConfirm() {
    if (!selectedNewStatus.value) {
        alertStore.error('Pilih status baru')
        return
    }

    if (selectedNewStatus.value === 'ditolak' && statusReason.value.length < 50) {
        alertStore.error('Alasan penolakan wajib diisi minimal 50 karakter')
        return
    }

    if (selectedNewStatus.value === 'menunggu_konfirmasi_selesai' && statusNote.value.trim().length < 50) {
        alertStore.error('Alasan penyelesaian wajib diisi minimal 50 karakter')
        return
    }

    showStatusDialog.value = false
    showStatusConfirmDialog.value = true
}

async function handleStatusChange() {
    if (selectedNewStatus.value === 'ditolak' && !statusReason.value) {
        alertStore.error('Alasan penolakan wajib diisi')
        return
    }

    if (selectedNewStatus.value === 'menunggu_konfirmasi_selesai' && !statusNote.value) {
        alertStore.error('Catatan tindak lanjut wajib diisi')
        return
    }

    showStatusDialog.value = false
    showStatusConfirmDialog.value = true
}

async function handleStatusConfirm() {
    isUpdatingStatus.value = true
    try {
        await laporanStore.updateLaporanStatus(
            id,
            selectedNewStatus.value,
            statusReason.value,
            statusNote.value
        )
        const successMessage = selectedNewStatus.value === 'menunggu_konfirmasi_selesai'
            ? `Status laporan berhasil diperbarui. Alasan penyelesaian: ${statusNote.value}`
            : 'Status laporan berhasil diperbarui'
        alertStore.success(successMessage)
        showStatusConfirmDialog.value = false
        selectedNewStatus.value = ''
        statusReason.value = ''
        statusNote.value = ''
        fetchDetail()
    } catch (error: any) {
    if (error?.name === 'ServerHandledError') {
      console.error('[DetailLaporanBullying] Request failed (handled globally):', error.message);
      return;
    }
        const errorMsg = String(error?.message || error)
        if (errorMsg.includes('403')) {
            alertStore.error('Anda tidak memiliki akses mengubah status')
        } else if (errorMsg.includes('Tidak dapat mengubah status')) {
            alertStore.error(errorMsg)
        } else {
            alertStore.error('Gagal mengubah status laporan')
        }
    } finally {
        isUpdatingStatus.value = false
    }
}

async function handlePelaporKonfirmasiSelesai(reason = '') {
    if (!laporan.value) return

    isConfirmingCompletion.value = true
    try {
        await laporanStore.updateLaporanStatus(laporan.value.id, 'selesai', undefined, reason)
        alertStore.success(
            reason
                ? `Laporan dikonfirmasi selesai. Alasan persetujuan: ${reason}`
                : 'Laporan dikonfirmasi selesai'
        )
        fetchDetail()
    } catch (error: any) {
    if (error?.name === 'ServerHandledError') {
      console.error('[DetailLaporanBullying] Request failed (handled globally):', error.message);
      return;
    }
        const errorMsg = String(error?.message || error)
        if (errorMsg.includes('403')) {
            alertStore.error('Hanya pelapor yang dapat mengonfirmasi status ini')
        } else {
            alertStore.error(errorMsg || 'Gagal mengonfirmasi status laporan')
        }
    } finally {
        isConfirmingCompletion.value = false
    }
}

async function handlePelaporBelumSelesai() {
    if (!laporan.value) return

    isConfirmingCompletion.value = true
    try {
        await laporanStore.updateLaporanStatus(laporan.value.id, 'diproses')
        alertStore.success('Laporan dikembalikan ke status diproses')
        fetchDetail()
    } catch (error: any) {
    if (error?.name === 'ServerHandledError') {
      console.error('[DetailLaporanBullying] Request failed (handled globally):', error.message);
      return;
    }
        const errorMsg = String(error?.message || error)
        if (errorMsg.includes('403')) {
            alertStore.error('Hanya pelapor yang dapat mengonfirmasi status ini')
        } else {
            alertStore.error(errorMsg || 'Gagal mengubah konfirmasi penyelesaian')
        }
    } finally {
        isConfirmingCompletion.value = false
    }
}

function openPelaporDecisionDialog(decision: 'setuju' | 'belum_selesai') {
    pelaporDecision.value = decision
    pelaporApprovalReason.value = ''
    showPelaporDecisionDialog.value = true
}

async function confirmPelaporDecision() {
    if (pelaporDecision.value === 'setuju' && pelaporApprovalReason.value.trim().length < 50) {
        alertStore.error('Alasan persetujuan wajib minimal 50 karakter')
        return
    }

    if (pelaporDecision.value === 'setuju') {
        await handlePelaporKonfirmasiSelesai(pelaporApprovalReason.value.trim())
    } else if (pelaporDecision.value === 'belum_selesai') {
        await handlePelaporBelumSelesai()
    }

    showPelaporDecisionDialog.value = false
    pelaporDecision.value = null
}

const loadedImages = ref<Record<string, boolean>>({})
const onImageLoad = (id: string) => {
    loadedImages.value[id] = true
}
</script>

<template>
  <div class="stf-page">
    <div class="detail-inner">

      <!-- ── Header ── -->
      <div class="detail-header">
        <button @click="router.back()" class="back-btn" aria-label="Kembali">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="header-text">
          <h1 class="stf-page-title">Detail Laporan Bullying</h1>
          <p class="header-sub">Lihat detail dan tanggapi laporan bullying di bawah ini.</p>
        </div>
      </div>

      <!-- ── Loading ── -->
      <div v-if="loading" class="loading-state">
        <p>Memuat detail laporan...</p>
      </div>

      <!-- ── Content ── -->
      <template v-else-if="laporan">
        <div class="content-grid">

          <!-- ══ Main Column ══ -->
          <div class="main-col">

            <!-- Card: Info Utama -->
            <SCard class="card-section">
              <div class="card-title-row">
                <div class="card-title-text">
                  <h2 class="laporan-judul">{{ laporan.judul }}</h2>
                  <p class="laporan-no">{{ laporan.no_laporan }}</p>
                </div>
                <SChip size="large" variant="solid" :tone="statusTone(laporan.status)" :label="statusLabel(laporan.status)" />
              </div>

              <div class="section-body">
                <div>
                  <h3 class="section-label">Isi Laporan</h3>
                  <div class="deskripsi-box">{{ laporan.deskripsi }}</div>
                </div>

                <div class="meta-grid">
                  <div class="meta-item">
                    <h3 class="meta-label">Jenis Bullying</h3>
                    <p class="meta-value">{{ laporan.jenis_bullying }}</p>
                  </div>
                  <div class="meta-item">
                    <h3 class="meta-label">Lokasi Kejadian</h3>
                    <p class="meta-value">{{ laporan.lokasi }}</p>
                  </div>
                  <div class="meta-item">
                    <h3 class="meta-label">Tanggal Kejadian</h3>
                    <p class="meta-value">{{ formatDate(laporan.tanggal_kejadian) }}</p>
                  </div>
                  <div class="meta-item">
                    <h3 class="meta-label">Waktu Kejadian</h3>
                    <p class="meta-value">{{ formatTime(laporan.waktu_kejadian) }}</p>
                  </div>
                  <div class="meta-item">
                    <h3 class="meta-label">Tanggal Lapor</h3>
                    <p class="meta-value meta-value--blue">{{ formatDate(laporan.tanggal_laporan, true) }}</p>
                  </div>
                </div>
              </div>
            </SCard>

            <!-- Card: Bukti Pendukung -->
            <SCard class="card-section">
              <h3 class="stf-page-subtitle">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-blue"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                Bukti Pendukung
              </h3>
              <div v-if="laporan.foto_bukti && laporan.foto_bukti.length > 0">
                <SButton label="Lihat Bukti Pendukung" variant="primary" class="w-full justify-center" @click="showBuktiDialog = true" />
              </div>
              <div v-else class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <p>Tidak ada bukti pendukung</p>
              </div>
            </SCard>

            <!-- Card: Riwayat Status -->
            <SCard class="card-section">
              <h3 class="stf-page-subtitle">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-blue"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Riwayat Status
              </h3>

              <div v-if="laporan.riwayat_status && laporan.riwayat_status.length > 0" class="timeline">
                <div v-for="(riwayat, index) in laporan.riwayat_status" :key="index" class="timeline-item">
                  <span class="timeline-dot" :class="{
                    'dot--menunggu': riwayat.status === 'menunggu',
                    'dot--diproses': riwayat.status === 'diproses',
                    'dot--selesai': riwayat.status === 'selesai',
                    'dot--merah': riwayat.status === 'dibatalkan' || riwayat.status === 'ditolak',
                    'dot--abu': !['menunggu','diproses','selesai','dibatalkan','ditolak'].includes(riwayat.status)
                  }"></span>
                  <div class="timeline-content">
                    <div class="timeline-row">
                      <span class="timeline-status">{{ statusLabel(riwayat.status) }}</span>
                      <span class="timeline-date">{{ formatDate(riwayat.created_at, true) }}</span>
                    </div>
                    <p class="timeline-catatan">{{ formatRiwayatCatatan(riwayat) }}</p>
                    <p v-if="riwayat.status === 'dibatalkan' && riwayat.alasan_pembatalan" class="timeline-catatan">
                      <strong>Alasan Pembatalan:</strong> {{ riwayat.alasan_pembatalan }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <p>Belum ada riwayat status</p>
              </div>
            </SCard>

            <!-- Card: Pesan Tanggapan -->
              <SCard class="card-section pesan-col">
                <h3 class="stf-page-subtitle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" class="icon-blue">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Pesan Tanggapan
                </h3>

                <STanggapanThread :laporan-id="id" />
                <STanggapanForm :laporan-id="id" :laporan-status="laporan.status" laporan-type="bullying" />
            </SCard>
          </div>

          <!-- ══ Sidebar ══ -->
          <div class="side-col">

            <!-- Card: Info Pelapor -->
            <SCard class="card-section">
              <h3 class="stf-page-subtitle">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-blue"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Informasi Pelapor
              </h3>

              <div class="pelapor-body">
                <div v-if="laporan.anonimitas" class="anon-banner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                  <span>Laporan ini dikirim secara anonim. Identitas pelapor dilindungi.</span>
                </div>

                <template v-else>
                  <div class="info-field">
                    <span class="info-label">Nama Pelapor</span>
                    <span class="info-value">{{ laporan.nama_pengirim || '-' }}</span>
                  </div>
                  <div class="info-field">
                    <span class="info-label">Kelas / Angkatan</span>
                    <span class="info-value">{{ laporan.kelas || '-' }}</span>
                  </div>
                </template>

                <div v-if="isAdmin" class="info-field">
                  <span class="info-label">Status Akun Pelapor</span>
                  <span class="info-verified" :class="laporan.akun_terverifikasi ? 'verified--yes' : 'verified--no'">
                    <svg v-if="laporan.akun_terverifikasi" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    {{ laporan.akun_terverifikasi ? 'Terverifikasi' : 'Belum Terverifikasi' }}
                  </span>
                </div>
              </div>
            </SCard>

            <!-- Card: Tindak Lanjut -->
            <SCard class="card-section card-action">
              <h3 class="card-subtitle card-subtitle--blue">Tindak Lanjut Laporan</h3>

              <div class="flex flex-col gap-3">
                <div
                  v-if="tindakLanjutMessage && !(isPelapor && laporan.status === 'menunggu_konfirmasi_selesai')"
                  class="status-locked-box p-3 bg-gray-100 rounded text-sm text-gray-600"
                >
                  <p>{{ tindakLanjutMessage }}</p>
                </div>

                <template v-if="isPelapor && laporan.status === 'menunggu'">
                  <SButton
                    label="Edit Laporan"
                    variant="primary"
                    class="w-full justify-center"
                    @click="$router.push({ name: 'editLaporanBullying', params: { id: laporan.id } })"
                  />
                  <SButton
                    label="Batalkan Laporan"
                    variant="danger"
                    class="w-full justify-center"
                    @click="showBatalkanDialog = true"
                  />
                </template>

                <template v-else-if="isPelapor && laporan.status === 'menunggu_konfirmasi_selesai'">
                  <SButton
                    label="Setuju, Sudah Selesai"
                    variant="primary"
                    class="w-full justify-center"
                    :disabled="isConfirmingCompletion"
                    @click="openPelaporDecisionDialog('setuju')"
                  />
                  <SButton
                    label="Belum Selesai"
                    variant="danger"
                    class="w-full justify-center"
                    :disabled="isConfirmingCompletion"
                    @click="openPelaporDecisionDialog('belum_selesai')"
                  />
                  <p class="action-note action-note--warning">Jika dalam 7 hari tidak ada konfirmasi dari pelapor, laporan akan disetujui otomatis.</p>
                </template>

                <!-- Admin Actions (Priority over Pelapor) -->
                <template v-if="isAdmin && !tindakLanjutMessage">
                  <div v-if="getAvailableStatusOptions().length > 0" class="space-y-3">
                    <SButton 
                      label="Ubah Status Laporan" 
                      variant="primary" 
                      class="w-full justify-center"
                      @click="openStatusDialog"
                      :disabled="laporan.status === 'selesai' || laporan.status === 'ditolak'"
                    />
                  </div>
                </template>
              </div>
            </SCard>
          </div>
        </div>
      </template>
    </div>

    <!-- ══ Modals ══ -->
    <SDialog :visible="showBatalkanDialog" variant="danger" title="Batalkan Laporan" @update:visible="showBatalkanDialog = $event" @close="showBatalkanDialog = false">
      <div class="dialog-body">
        <p class="dialog-text">Apakah Anda yakin ingin membatalkan laporan ini? Tindakan ini tidak dapat diurungkan.</p>
        <div>
          <label class="dialog-label">Alasan Pembatalan (Min. 50 Karakter)</label>
          <textarea v-model="alasanPembatalan" class="dialog-textarea" placeholder="Masukkan alasan yang jelas mengapa laporan dibatalkan..."></textarea>
          <p class="dialog-char-count">{{ alasanPembatalan.length }} karakter</p>
        </div>
      </div>
      <template #actions>
        <div class="dialog-actions">
          <SButton label="Batal" variant="secondary" @click="showBatalkanDialog = false" />
          <SButton label="Ya, Batalkan" variant="danger" @click="handleBatalkan" :disabled="alasanPembatalan.length < 50" />
        </div>
      </template>
    </SDialog>

    <!-- Status Update Dialog -->
    <SDialog :visible="showStatusDialog" variant="primary" title="Ubah Status Laporan" @update:visible="showStatusDialog = $event" @close="showStatusDialog = false">
      <div class="dialog-body dialog-body--full">
        <p class="dialog-text">Pilih status baru untuk laporan bullying ini.</p>
        
        <!-- Status options dropdown -->
        <div>
          <label class="dialog-label">Status Baru</label>
          <div class="status-dropdown-wrap">
            <button type="button" class="status-dropdown-trigger" @click="showStatusOptions = !showStatusOptions">
              <SChip
                v-if="selectedStatusOption"
                size="large"
                variant="solid"
                :tone="selectedStatusOption.value === 'menunggu_konfirmasi_selesai' ? 'success' : statusTone(selectedStatusOption.value)"
                :label="selectedStatusOption.label"
              />
              <span v-else class="status-dropdown-placeholder">-- Pilih Status --</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="status-dropdown-chevron" :class="{ 'status-dropdown-chevron--open': showStatusOptions }"><polyline points="6 9 12 15 18 9" /></svg>
            </button>

            <div v-if="showStatusOptions" class="status-dropdown-menu">
              <button
                v-for="opt in getAvailableStatusOptions()"
                :key="opt.value"
                type="button"
                class="status-option-btn"
                @click="selectStatusOption(opt.value)"
              >
                <SChip
                  size="large"
                  variant="solid"
                  :tone="opt.value === 'menunggu_konfirmasi_selesai' ? 'success' : statusTone(opt.value)"
                  :label="opt.label"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Reason field (for ditolak) -->
        <div v-if="selectedNewStatus === 'ditolak'">
          <label class="dialog-label">
            Alasan Penolakan (Min. 50 Karakter)
            <span class="required-asterisk">*</span>
          </label>
          <textarea v-model="statusReason" class="dialog-textarea" placeholder="Masukkan alasan yang jelas mengapa laporan ditolak..."></textarea>
          <p class="dialog-char-count">{{ statusReason.length }} karakter</p>
        </div>

        <!-- Reason field (required for completion request) -->
        <div v-if="selectedNewStatus === 'menunggu_konfirmasi_selesai'">
          <label class="dialog-label">
            Alasan Penyelesaian (Min. 50 Karakter)
            <span class="required-asterisk">*</span>
          </label>
          <textarea v-model="statusNote" class="dialog-textarea" placeholder="Jelaskan tindak lanjut yang sudah dilakukan sebelum meminta konfirmasi pelapor..."></textarea>
          <p class="dialog-char-count">{{ statusNote.length }} karakter</p>
        </div>
      </div>
      <template #actions>
        <div class="dialog-actions dialog-actions--full">
          <SButton label="Batal" variant="secondary" class="w-full justify-center" @click="showStatusDialog = false" />
          <SButton label="Lanjutkan" variant="primary" @click="proceedToStatusConfirm" class="w-full justify-center" :disabled="!selectedNewStatus || (selectedNewStatus === 'ditolak' && statusReason.length < 50) || (selectedNewStatus === 'menunggu_konfirmasi_selesai' && statusNote.trim().length < 50)" />
        </div>
      </template>
    </SDialog>

    <!-- Status Confirmation Dialog -->
    <SDialog :visible="showStatusConfirmDialog" variant="primary" title="Konfirmasi Perubahan Status" @update:visible="showStatusConfirmDialog = $event" @close="showStatusConfirmDialog = false">
      <div class="dialog-body dialog-body--full status-confirm-body">
        <p class="dialog-text status-confirm-text">Apakah Anda yakin ingin mengubah status laporan?</p>
        
        <!-- Show summary -->
        <div class="status-summary-box status-summary-box--center">
          <div class="status-summary-row status-summary-row--center">
            <span class="font-medium">Saat Ini:</span>
            <SChip
              size="large"
              variant="solid"
              :tone="statusTone(laporan?.status || '')"
              :label="statusLabel(laporan?.status || '')"
            />
          </div>
          <div class="status-summary-row status-summary-row--center">
            <span class="font-medium">Baru:</span>
            <SChip
              size="large"
              variant="solid"
              :tone="statusTone(selectedNewStatus)"
              :label="statusLabel(selectedNewStatus)"
            />
          </div>
          <div v-if="selectedNewStatus === 'menunggu_konfirmasi_selesai'" class="status-summary-note">
            Laporan akan menunggu persetujuan pelapor sebelum menjadi status Selesai.
          </div>
          <div v-if="statusReason" class="status-summary-note"><span class="font-medium">Alasan:</span> {{ statusReason }}</div>
          <div v-if="statusNote" class="status-summary-note"><span class="font-medium">Alasan Penyelesaian:</span> {{ statusNote }}</div>
        </div>
      </div>
      <template #actions>
        <div class="dialog-actions dialog-actions--full">
          <SButton label="Batal" variant="secondary" class="w-full justify-center" @click="showStatusConfirmDialog = false" :disabled="isUpdatingStatus" />
          <SButton label="Ya, Ubah Status" variant="primary" class="w-full justify-center" @click="handleStatusConfirm" :disabled="isUpdatingStatus" />
        </div>
      </template>
    </SDialog>

    <!-- Pelapor Decision Dialog -->
    <SDialog :visible="showPelaporDecisionDialog" :variant="pelaporDecision === 'belum_selesai' ? 'danger' : 'primary'" :title="pelaporDecision === 'setuju' ? 'Konfirmasi Penyelesaian Laporan' : 'Konfirmasi Belum Selesai'" @update:visible="showPelaporDecisionDialog = $event" @close="showPelaporDecisionDialog = false">
      <div class="dialog-body">
        <p class="dialog-text" v-if="pelaporDecision === 'setuju'">
          Apakah Anda yakin laporan ini sudah selesai? Setelah disetujui, status laporan akan menjadi Selesai.
        </p>
        <p class="dialog-text" v-else>
          Apakah Anda yakin laporan ini belum selesai? Status laporan akan dikembalikan ke Diproses.
        </p>
        <div v-if="pelaporDecision === 'setuju'">
          <label class="dialog-label">
            Alasan Disetujui (Min. 50 Karakter)
            <span class="required-asterisk">*</span>
          </label>
          <textarea v-model="pelaporApprovalReason" class="dialog-textarea" placeholder="Tulis alasan Anda menyetujui bahwa laporan ini sudah selesai..."></textarea>
          <p class="dialog-char-count">{{ pelaporApprovalReason.length }} karakter</p>
        </div>
      </div>
      <template #actions>
        <div class="dialog-actions dialog-actions--full">
          <SButton label="Batal" variant="secondary" class="w-full justify-center" :disabled="isConfirmingCompletion" @click="showPelaporDecisionDialog = false" />
          <SButton :label="pelaporDecision === 'setuju' ? 'Ya, Setuju' : 'Ya, Kembalikan ke Diproses'" :variant="pelaporDecision === 'belum_selesai' ? 'danger' : 'primary'" class="w-full justify-center" :disabled="isConfirmingCompletion || (pelaporDecision === 'setuju' && pelaporApprovalReason.trim().length < 50)" @click="confirmPelaporDecision" />
        </div>
      </template>
    </SDialog>

    <SDialog :visible="showBuktiDialog" variant="primary" title="Bukti Pendukung" @update:visible="showBuktiDialog = $event" @close="showBuktiDialog = false">
      <div class="bukti-scroll">
        <div v-for="bukti in laporan.foto_bukti" :key="bukti.id" class="bukti-item fixed-container">
          <div v-show="!loadedImages[bukti.id]" class="simple-loader">
            <div class="simple-spinner"></div>
            <p>Memuat foto...</p>
          </div>
          <a :href="formatImageUrl(bukti.foto)" target="_blank" class="bukti-link" :class="{ 'hidden-link': !loadedImages[bukti.id] }">
            <img :src="formatImageUrl(bukti.foto)" alt="Bukti Pendukung" 
                  class="bukti-img" 
                  :class="{ 'opacity-100': loadedImages[bukti.id], 'opacity-0': !loadedImages[bukti.id] }"
                  @load="onImageLoad(bukti.id)" 
                  loading="lazy" />
          </a>
        </div>
      </div>
      <template #actions>
        <div class="dialog-actions">
          <SButton label="Tutup" variant="secondary" @click="showBuktiDialog = false" />
        </div>
      </template>
    </SDialog>
  </div>
</template>

<style scoped>
/* ─── Base font ─── */
* { font-family: "Be Vietnam Pro", sans-serif; }

/* ─── Page shell ─── */
.detail-page {
    min-height: calc(100vh - 64px);
    background: var(--color-general-frame);
    padding: 32px 16px;
}
.detail-inner {
    max-width: 1024px;
    margin: 0 auto;
}

/* ─── Header ─── */
.detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
}
.back-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 9999px;
    cursor: pointer;
    transition: background 0.2s;
    color: #4b5563;
}
.back-btn:hover { background: #f9fafb; }
.header-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-general-black);
    margin: 0;
    line-height: 1.3;
}
.header-sub {
    font-size: 13px;
    color: #6b7280;
    margin: 4px 0 0;
}

/* ─── Loading ─── */
.loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 240px;
    color: #6b7280;
    font-size: 14px;
}

/* ─── Content grid ─── */
.content-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
    align-items: start;
}
.main-col { display: flex; flex-direction: column; gap: 20px; }
.side-col  { display: flex; flex-direction: column; gap: 20px; }

/* ─── Cards ─── */
.card-section {
    padding: 24px;
}
.card-action {
    background: var(--color-blue-50);
    border: 1px solid var(--color-blue-100);
}

/* ─── Card title row ─── */
.card-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f3f4f6;
    flex-wrap: wrap;
}
.laporan-judul {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-general-black);
    margin: 0;
    line-height: 1.4;
}
.laporan-no {
    font-size: 13px;
    color: #6b7280;
    margin: 6px 0 0;
}

/* ─── Section body ─── */
.section-body { display: flex; flex-direction: column; gap: 20px; }
.section-label {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 8px;
}
.deskripsi-box {
    background: #f9fafb;
    border: 1px solid #f3f4f6;
    border-radius: 8px;
    padding: 16px;
    font-size: 14px;
    color: #1f2937;
    white-space: pre-wrap;
    line-height: 1.7;
    word-break: break-word;
}

/* ─── Meta grid ─── */
.meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}
.meta-item {
    background: white;
    border: 1px solid #f3f4f6;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.meta-label {
    font-size: 10px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0;
}
.meta-value {
    font-size: 13px;
    color: var(--color-general-black);
    margin: 0;
    word-break: break-word;
}
.meta-value--blue { color: #2563eb; }

/* ─── Card subtitle ─── */
.card-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 16px;
}
.card-subtitle--blue { color: var(--color-blue-800, #1e40af); }
.icon-blue { color: #2563eb; flex-shrink: 0; }

/* ─── Empty state ─── */
.empty-state {
    background: #f9fafb;
    border: 1px dashed #d1d5db;
    border-radius: 8px;
    padding: 32px 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}
.empty-icon { color: #9ca3af; }
.empty-state p { font-size: 13px; color: #6b7280; margin: 0; }

/* ─── Timeline ─── */
.timeline {
    position: relative;
    border-left: 2px solid #f3f4f6;
    margin-left: 8px;
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
}
.timeline-item {
    position: relative;
    padding-left: 24px;
}
.timeline-dot {
    position: absolute;
    left: -9px;
    top: 4px;
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    box-shadow: 0 0 0 4px white;
    flex-shrink: 0;
}
.dot--menunggu  { background: #f59e0b; }
.dot--diproses  { background: #3b82f6; }
.dot--selesai   { background: #22c55e; }
.dot--merah     { background: #ef4444; }
.dot--abu       { background: #9ca3af; }

.timeline-content { display: flex; flex-direction: column; gap: 4px; }
.timeline-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
}
.timeline-status { font-size: 13px; font-weight: 700; color: #1f2937; }
.timeline-date   { font-size: 11px; color: #6b7280; }
.timeline-catatan {
    font-size: 13px;
    color: #4b5563;
    background: #f9fafb;
    border: 1px solid #f3f4f6;
    border-radius: 8px;
    padding: 10px 12px;
    white-space: pre-wrap;
    margin: 4px 0 0;
    word-break: break-word;
}

/* ─── Pelapor ─── */
.pelapor-body { display: flex; flex-direction: column; gap: 14px; }
.anon-banner {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    color: #92400e;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 12px;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    line-height: 1.5;
}
.info-field { display: flex; flex-direction: column; gap: 3px; }
.info-label { font-size: 11px; color: #6b7280; }
.info-value { font-size: 13px; font-weight: 600; color: #1f2937; }
.info-verified {
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 3px;
}
.verified--yes { color: #16a34a; }
.verified--no  { color: #dc2626; }

/* ─── Action card ─── */
.action-note { font-size: 13px; color: #6b7280; font-style: italic; line-height: 1.5; }
.action-note--warning {
  color: #b45309;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 8px 10px;
  font-style: normal;
}

/* ─── Status badges removed ─── */

/* ─── Dialog ─── */
.dialog-body   { display: flex; flex-direction: column; gap: 12px; }
.dialog-text   { font-size: 14px; color: #4b5563; margin: 0; line-height: 1.6; }
.dialog-label  { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; }
.dialog-textarea {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 13px;
    font-family: "Be Vietnam Pro", sans-serif;
    min-height: 100px;
    resize: vertical;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.dialog-textarea:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59,130,246,.12);
}
.dialog-char-count { font-size: 11px; color: #6b7280; text-align: right; margin-top: 4px; }
.dialog-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    width: 100%;
    flex-wrap: wrap;
}

/* ─── Bukti images ─── */
.bukti-scroll {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 60vh;
    overflow-y: auto;
    padding: 4px 2px;
}
.bukti-item {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #f3f4f6;
    background: #f9fafb;
    display: flex;
    justify-content: center;
}
.fixed-container {
    height: 350px;
    width: 100%;
    position: relative;
}
.bukti-link { 
    display: flex; 
    justify-content: center; 
    align-items: center;
    width: 100%; 
    height: 100%;
}
.hidden-link { pointer-events: none; }

.bukti-img { 
    width: 100%; 
    height: 100%;
    object-fit: contain; 
    border-radius: 6px; 
    transition: opacity 0.4s ease-in-out;
}

/* ════════════════════════════════════════════
   RESPONSIVE
   ════════════════════════════════════════════ */

/* ── Tablet narrow: collapse to single column ── */
@media (max-width: 860px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
    /* Sidebar goes below main on tablet, but above on mobile via order */
    .side-col {
        /* two-column row for sidebar cards */
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
}

/* ── Tablet (601px – 860px) ── */
@media (min-width: 601px) and (max-width: 860px) {
    .detail-page { padding: 24px 16px; }
    .header-title { font-size: 20px; }
    .card-section { padding: 20px; }
    .laporan-judul { font-size: 16px; }
}

/* ── Mobile (≤ 600px) ── */
@media (max-width: 600px) {
    /* Shell */
    .detail-page {
        padding: 0 0 env(safe-area-inset-bottom, 24px);
        background: var(--color-general-frame);
    }
    .detail-inner {
        padding: 0;
    }

    /* Header */
    .detail-header {
        background: white;
        padding: 16px;
        margin-bottom: 0;
        border-bottom: 1px solid #f3f4f6;
        gap: 12px;
    }
    .back-btn { width: 36px; height: 36px; }
    .header-title { font-size: 16px; }
    .header-sub { font-size: 12px; }

    /* Content grid: single column, no gap between page sections */
    .content-grid {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 12px;
    }
    .main-col { gap: 8px; }

    /* Sidebar: stack vertically on mobile */
    .side-col {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    /* Cards */
    .card-section { padding: 16px; }

    /* Title row: stack badge under title */
    .card-title-row {
        flex-direction: column;
        gap: 10px;
        align-items: flex-start;
    }
    .laporan-judul { font-size: 15px; }
    .laporan-no    { font-size: 12px; }

    /* Deskripsi */
    .deskripsi-box { font-size: 13px; padding: 12px; }

    /* Meta grid: 1 column on very small */
    .meta-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .meta-label { font-size: 9px; }
    .meta-value { font-size: 12px; }

    /* Section label */
    .section-label { font-size: 10px; }

    /* Card subtitle */
    .card-subtitle { font-size: 12px; margin-bottom: 12px; }

    /* Timeline */
    .timeline-status { font-size: 12px; }
    .timeline-date   { font-size: 10px; }
    .timeline-catatan{ font-size: 12px; padding: 8px 10px; }

    /* Info */
    .info-label { font-size: 10px; }
    .info-value { font-size: 12px; }
    .anon-banner { font-size: 11px; }

    /* Badge removed */

    /* Dialog actions: full width stack */
    .dialog-actions {
        flex-direction: column-reverse;
    }
    .dialog-actions > * { width: 100%; }
    .dialog-text  { font-size: 13px; }
    .dialog-label { font-size: 12px; }
}

/* ── Very small (≤ 360px) ── */
@media (max-width: 360px) {
    .header-title { font-size: 14px; }
    .meta-grid { grid-template-columns: 1fr; }
    .laporan-judul { font-size: 14px; }
}

/* ─── Simple Loader ─── */
.simple-loader {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 12px;
    background-color: #f9fafb;
    color: #6b7280;
    font-size: 14px;
    z-index: 10;
}

.simple-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #e5e7eb;
    border-top-color: var(--color-blue-600);
    border-radius: 50%;
    animation: simple-spin 1s linear infinite;
}

@keyframes simple-spin {
    to { transform: rotate(360deg); }
}

.opacity-0 { opacity: 0; }
.opacity-100 { opacity: 1; }

/* ─── Dialog ─── */
.dialog-body   { display: flex; flex-direction: column; gap: 12px; }
.dialog-body--full { width: 100%; }
.dialog-text   { font-size: 14px; color: #4b5563; margin: 0; line-height: 1.6; }
.dialog-text--muted { color: #92400e; }
.dialog-label  { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; }
.required-asterisk {
    color: #dc2626;
    margin-left: 4px;
    font-weight: 700;
}
.dialog-textarea {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 13px;
    font-family: "Be Vietnam Pro", sans-serif;
    min-height: 100px;
    resize: vertical;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.dialog-textarea:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59,130,246,.12);
}
.status-dropdown-wrap {
    position: relative;
    width: 100%;
}
.status-dropdown-trigger {
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 12px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}
.status-dropdown-trigger:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59,130,246,.12);
}
.status-dropdown-placeholder {
    color: #9ca3af;
    font-size: 13px;
}
.status-dropdown-chevron {
    color: #6b7280;
    transition: transform 0.2s ease;
    flex-shrink: 0;
}
.status-dropdown-chevron--open {
    transform: rotate(180deg);
}
.status-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 10;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 220px;
    overflow-y: auto;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}
.status-option-btn {
    border: none;
    background: transparent;
    width: 100%;
    padding: 2px;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
    transition: background-color 0.2s ease;
}
.status-option-btn:hover {
    background: #f3f4f6;
}
.dialog-char-count { font-size: 11px; color: #6b7280; text-align: right; margin-top: 4px; }
.dialog-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    width: 100%;
    flex-wrap: wrap;
}
.dialog-actions--full {
    width: 100%;
    justify-content: stretch;
    gap: 12px;
}
.dialog-actions--full > * {
    flex: 1 1 0;
}

.status-summary-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    color: #374151;
}
.status-chip-inline {
    display: flex;
    align-items: center;
}
.status-confirm-body {
    align-items: center;
}
.status-confirm-text {
    text-align: center;
}
.status-summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}
.status-summary-box--center {
    text-align: center;
}
.status-summary-row--center {
    justify-content: center;
    flex-wrap: wrap;
}
.status-summary-note {
    text-align: center;
    word-break: break-word;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    max-height: 56px;
}

/* ─── Bukti images ─── */
.bukti-scroll {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 60vh;
    overflow-y: auto;
    padding: 4px 2px;
}
.bukti-item {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #f3f4f6;
    background: #f9fafb;
    display: flex;
    justify-content: center;
}
.fixed-container {
    height: 350px;
    width: 100%;
    position: relative;
}
.bukti-link { 
    display: flex; 
    justify-content: center; 
    align-items: center;
    width: 100%; 
    height: 100%;
}
.hidden-link { pointer-events: none; }

.bukti-img { 
    width: 100%; 
    height: 100%;
    object-fit: contain; 
    border-radius: 6px; 
    transition: opacity 0.4s ease-in-out;
}

/* ─── Utility classes ─── */
.w-full { width: 100%; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.gap-3 { gap: 0.75rem; }
.justify-center { justify-content: center; }
</style>