<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAspirasiStore } from '@/stores/aspirasi'
import { useAlertStore } from '@/stores/alert'
import { useNotFoundStore } from '@/stores/notFound'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SDialog from '@/components/SDialog.vue'
import SChip from '@/components/SChip.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const aspirasiStore = useAspirasiStore()
const alertStore = useAlertStore()

const loading = ref(true)

const showBuktiDialog = ref(false)
const showStatusDialog = ref(false)
const showUnmarkDialog = ref(false)
const statusCatatan = ref('')

const laporan = computed(() => aspirasiStore.detailAspirasi)
const isAdmin = computed(() => authStore.user?.role === 'kemahasiswaan')
const isPelapor = computed(() => !isAdmin.value)

const canEdit = computed(() => {
  if (!laporan.value || !laporan.value.tanggal_aspirasi) return false
  const tanggalDibuat = new Date(laporan.value.tanggal_aspirasi)
  const tanggalSekarang = new Date()
  const selisihWaktu = tanggalSekarang.getTime() - tanggalDibuat.getTime()
  const batasTujuhHari = 7 * 24 * 60 * 60 * 1000
  return selisihWaktu <= batasTujuhHari
})

const tindakLanjutMessage = computed(() => {
  if (!laporan.value) return ''
  
  if (canEdit.value) {
    return 'Laporan dapat diubah sampai 7 hari setelah dibuat.'
  } else {
    return laporan.value.pesan_tindak_lanjut || 'Laporan ini tidak dapat diubah lagi karena sudah lebih dari 7 hari.'
  }
})

async function fetchDetail(detailId: string) {
    loading.value = true
    try {
        await aspirasiStore.fetchDetailAspirasi(detailId)
    } catch (error: any) {
        const errorMsg = String(error?.message || error)
        
        if (useNotFoundStore().visible || errorMsg.includes('403') || errorMsg.includes('Akses ditolak') || errorMsg.includes('Forbidden') || error?.response?.status === 403) {
            router.replace('/aspirasi')
            return
        }

        if (errorMsg.includes('401')) {
            router.push('/login')
        } else {
            alertStore.error('Gagal memuat detail laporan')
            router.push('/aspirasi')
        }
    } finally {
        loading.value = false
    }
}

async function checkAndFetchDetail() {
    const id = route.params.id as string
    if (id) {
        await fetchDetail(id)
    }
}

const kategoriTabs = [
    { label: 'Semua', value: 'semua' },
    { label: 'Sarana & Prasarana', value: 'sarana' },
    { label: 'Kurikulum & Pembelajaran', value: 'kurikulum' },
    { label: 'Layanan Infrastruktur & Akademik', value: 'layanan' },
    { label: 'Ekstrakulikuler & Bakat', value: 'ekstrakulikuler' },
    { label: 'Kesehatan & Keamanan', value: 'kesehatan' },
    { label: 'Lainnya', value: 'lainnya' },
]

function kategoriLabel(key: string) {
	const found = kategoriTabs.find(k => k.value === key)
	return found ? found.label : key
}

onMounted(() => { 
    checkAndFetchDetail()
})

// Watch route params to refetch - only if still on this route
watch(() => route.params.id, async (newId) => {
    if (newId && route.name === 'detailAspirasi') {
        await fetchDetail(newId as string)
    }
})

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
    // Google Drive & other external URLs — return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    // Local development fallback
    const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '')
    if (path.startsWith('/media/')) return `${API_BASE}${path}`
    if (path.startsWith('/')) return `${API_BASE}/media${path}`
    return `${API_BASE}/media/${path}`
}

function statusDitandai(status: string): boolean {
    return status === 'ditandai'
}

async function tandaiAspirasi(){
  if (!laporan.value) return
  try {
    const updated = aspirasiStore.tandaiAspirasi(laporan.value.id)
    alertStore.success('Aspirasi berhasil ditandai')
    showStatusDialog.value = false
    statusCatatan.value = ''
  } catch (error: any) {
    handleError(error)
  }
}

async function batalkanTandaiAspirasi(){
  if (!laporan.value) return
  try {
    const updated = aspirasiStore.tandaiAspirasi(laporan.value.id)
    alertStore.success('Tanda aspirasi berhasil dihapus')
    await fetchDetail(laporan.value.id)
    showUnmarkDialog.value = false
  } catch (error: any) {
    handleError(error)
  }
}

// Helper untuk error handling agar tidak duplikasi code
function handleError(error: any) {
  const msg = String(error?.message || error)
  if (msg.includes('Sesi telah berakhir') || msg.includes('401')) {
    router.push('/login')
    return
  }
  alertStore.error(msg || 'Gagal memperbarui status')
}

function statusLabel(status: string) {
  return status === 'ditandai' ? 'Ditandai' : 'Tidak Ditandai'
}

function statusTone(status: string) {
  return status === 'ditandai' ? 'warning' : 'neutral'
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
          <h1 class="stf-page-title">Detail Aspirasi</h1>
          <p class="header-sub">Lihat detail dan tanggapi aspirasi di bawah ini.</p>
        </div>
      </div>

      <!-- ── Loading ── -->
      <div v-if="loading" class="loading-state">
        <p>Memuat detail aspirasi...</p>
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
                    
                    <SChip v-if="isAdmin" size="large" variant="solid" :tone="statusTone(laporan.status_ditandai)" :label="statusLabel(laporan.status_ditandai)" />
                </div>

                <div class="section-body">
                    <div>
                        <h3 class="section-label">Isi Laporan</h3>
                        <div class="deskripsi-box">{{ laporan.deskripsi }}</div>
                    </div>

                    <div class="meta-grid">
                        <div class="meta-item">
                                <h3 class="meta-label">Kategori</h3>
                                <p class="meta-value">{{ kategoriLabel(laporan.kategori) }}</p>
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
                Riwayat Aspirasi
              </h3>
                <p class="laporan-no">Dibuat pada {{ formatDate(laporan.tanggal_aspirasi, true) }}</p>
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
                  <span>Aspirasi ini dikirim secara anonim. Identitas pelapor dilindungi.</span>
                </div>

                <template v-else>
                  <div class="info-field">
                    <span class="info-label">Nama Pelapor</span>
                    <span class="info-value">{{ laporan.nama_lengkap || '-' }}</span>
                  </div>
                  <div class="info-field">
                    <span class="info-label">Kelas / Angkatan</span>
                    <span class="info-value">{{ laporan.kelas_pengirim || '-' }}</span>
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
                <div v-if="isAdmin">
                <p class="tandai-text"> Tandai aspirasi ini sebagai prioritas dan pertimbangan lebih lanjut</p>
                <SButton 
                    v-if="laporan.status_ditandai !== 'ditandai'"
                    label="Tandai" 
                    variant="primary" 
                    class="w-full justify-center" 
                    @click="showStatusDialog = true" 
                />
                <SButton 
                    v-else
                    label="Batalkan Tandai" 
                    variant="danger" 
                    class="w-full justify-center" 
                    @click="showUnmarkDialog = true" 
                />
                </div>

                <div v-if="isPelapor">
                    <template v-if="laporan && isPelapor">
                        <p v-if="canEdit" class="text-sm text-gray-600 mb-2 italic">
                            * {{ tindakLanjutMessage }}
                        </p>

                        <SButton 
                            v-if="canEdit"
                            label="Edit Laporan" 
                            variant="primary" 
                            class="w-full justify-center" 
                            @click="$router.push({ name: 'editAspirasi', params: { id: laporan.id } })"
                        />

                        <div v-else class="p-3 bg-white border border-gray-200 rounded-md text-sm text-gray-700">
                            {{ tindakLanjutMessage }}
                        </div>
                    </template>
                </div>
              </div>
            </SCard>
          </div>
        </div>
      </template>
    </div>

    <!-- ══ Modals ══ -->
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

    <SDialog :visible="showStatusDialog" variant="primary" title="Tandai Aspirasi" @update:visible="showStatusDialog = $event" @close="showStatusDialog = false">
    <div class="dialog-body">
        <p>Aspirasi ini akan ditandai sebagai prioritas agar mudah dipantau dan tidak tercampur dengan aspirasi lainnya.</p>
    </div>
    <template #actions>
        <div class="dialog-actions">
        <SButton label="Batal" variant="secondary" @click="showStatusDialog = false" />
        <SButton label="Konfirmasi" variant="primary" @click="tandaiAspirasi()" />
        </div>
    </template>
    </SDialog>

    <SDialog :visible="showUnmarkDialog" variant="danger" title="Batalkan Tandai Aspirasi" @update:visible="showUnmarkDialog = $event" @close="showUnmarkDialog = false">
    <div class="dialog-body">
        <p>Anda akan menghapus tanda prioritas pada aspirasi ini. Aspirasi akan kembali ke daftar normal.</p>
    </div>
    <template #actions>
        <div class="dialog-actions">
        <SButton label="Kembali" variant="secondary" @click="showUnmarkDialog = false" />
        <SButton label="Ya, Hapus Tanda" variant="danger" @click="batalkanTandaiAspirasi()" />
        </div>
    </template>
    </SDialog>
  </div>
</template>

<style scoped>
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
.header-text {
    display: flex;
    flex-direction: column;
}
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
.pesan-col { grid-column: 1 / 2; }

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
.card-title-text {
    display: flex;
    flex-direction: column;
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
.stf-page-subtitle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 16px;
}
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

.tandai-text {
    font-size: 12px; 
    color: #6b7280; 
    margin-bottom: 15px;
}
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

/* ── Tablet narrow: collapse to single column ── */
@media (max-width: 860px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
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

    .deskripsi-box { font-size: 13px; padding: 12px; }

    /* Meta grid: 1 column on very small */
    .meta-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
    .meta-label { font-size: 9px; }
    .meta-value { font-size: 12px; }

    /* Section label */
    .section-label { font-size: 10px; }

    /* Card subtitle */
    .stf-page-subtitle { font-size: 12px; margin-bottom: 12px; }
    .card-subtitle { font-size: 12px; margin-bottom: 12px; }

    /* Info */
    .info-label { font-size: 10px; }
    .info-value { font-size: 12px; }

    /* Dialog actions: full width stack */
    .dialog-actions {
        flex-direction: column-reverse;
    }
    .dialog-actions > * { width: 100%; }
    .dialog-text  { font-size: 13px; }
    .dialog-label { font-size: 12px; }

    .status-locked-box {
        padding: 10px 12px !important;
        font-size: 12px !important;
        line-height: 1.4;
        text-align: center;
    }

    .status-locked-box p {
        font-size: 12px;
        margin: 0;
    }
}

@media (max-width: 360px) {
    .header-title { font-size: 14px; }
    .meta-grid { grid-template-columns: 1fr; }
    .card-section { padding: 12px; }
    .laporan-judul { font-size: 14px; }
}

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
</style>
