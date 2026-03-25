<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLaporanKerusakanStore } from '@/stores/laporanKerusakan'
import { useAlertStore } from '@/stores/alert'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SDialog from '@/components/SDialog.vue'
import SChip from '@/components/SChip.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const laporanStore = useLaporanKerusakanStore()
const alertStore = useAlertStore()

const id = route.params.id as string
const loading = ref(true)

const laporan = computed(() => laporanStore.currentLaporan)
const isKemahasiswaan = computed(() => authStore.user?.role === 'kemahasiswaan')
const isPelapor = computed(() => !isKemahasiswaan.value)

const showBatalkanDialog = ref(false)
const showBuktiDialog = ref(false)
const alasanPembatalan = ref('')

async function fetchDetail() {
    loading.value = true
    try {
        await laporanStore.fetchLaporanDetail(id)
    } catch (error: any) {
        const errorMsg = String(error?.message || error)
        if (errorMsg.includes('403') || errorMsg.includes('Akses ditolak') || errorMsg.includes('Forbidden') || error?.response?.status === 403) {
            alertStore.error('Anda tidak memiliki akses untuk melihat detail laporan ini')
            router.push({ path: '/laporan-kerusakan', query: { unauthorized: 'true' } })
        } else {
            alertStore.error('Gagal memuat detail laporan')
            router.push('/laporan-kerusakan')
        }
    } finally {
        loading.value = false
    }
}

onMounted(() => { fetchDetail() })

function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    return d.toLocaleDateString('id-ID', options).replace(' pukul ', ', ')
}

function formatImageUrl(path: string | undefined): string {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('/media/')) return path
    if (path.startsWith('/')) return `/media${path}`
    return `/media/${path}`
}

function statusLabel(status: string) {
    const map: Record<string, string> = {
        menunggu: 'Menunggu Konfirmasi',
        diproses: 'Diproses',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
        ditolak: 'Ditolak'
    }
    return map[status] || status
}

function statusTone(status: string): 'warning' | 'info' | 'success' | 'danger' {
    if (status === 'menunggu') return 'warning'
    if (status === 'diproses') return 'info'
    if (status === 'selesai') return 'success'
    return 'danger'
}

async function handleBatalkan() {
    if (!alasanPembatalan.value || alasanPembatalan.value.length < 50) {
        alertStore.error('Alasan pembatalan wajib diisi minimal 50 karakter')
        return
    }
    try {
        await laporanStore.cancelLaporanKerusakan(id, alasanPembatalan.value)
        alertStore.success('Laporan berhasil dibatalkan')
        showBatalkanDialog.value = false
        fetchDetail()
    } catch (error) { }
}

const pengirimNama = computed(() => {
    const lap = laporan.value
    return lap?.nama_lengkap || lap?.pelapor_info?.nama_lengkap || 'Pengguna Anonim'
})
const kelasPengirim = computed(() => {
    const lap = laporan.value
    return lap?.pelapor_info?.kelas || '-'
})
</script>

<template>
    <div class="stf-page">
        <div class="detail-inner">

            <!-- ── Header ── -->
            <div class="detail-header">
                <button @click="router.back()" class="back-btn" aria-label="Kembali">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                </button>
                <div class="header-text">
                    <h1 class="stf-page-title">Detail Laporan Kerusakan</h1>
                    <p class="header-sub">Lihat detail dan tanggapi laporan kerusakan di bawah ini.</p>
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
                                <SChip size="large" variant="solid" :tone="statusTone(laporan.status)"
                                    :label="statusLabel(laporan.status)" />
                            </div>

                            <div class="section-body">
                                <div>
                                    <h3 class="section-label">Isi Laporan</h3>
                                    <div class="deskripsi-box">{{ laporan.deskripsi }}</div>
                                </div>

                                <div class="meta-grid">
                                    <div class="meta-item">
                                        <h3 class="meta-label">Lokasi Kejadian</h3>
                                        <p class="meta-value">{{ laporan.lokasi }}</p>
                                    </div>
                                    <div class="meta-item">
                                        <h3 class="meta-label">Tanggal Kejadian</h3>
                                        <p class="meta-value">{{ formatDate(laporan.tanggal_kejadian) }}</p>
                                    </div>
                                    <div class="meta-item">
                                        <h3 class="meta-label">Tanggal Lapor</h3>
                                        <p class="meta-value meta-value--blue">{{ formatDate(laporan.tanggal_laporan) }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </SCard>

                        <!-- Card: Bukti Pendukung -->
                        <SCard class="card-section">
                            <h3 class="stf-page-subtitle">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="icon-blue">
                                    <path
                                        d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                    <circle cx="12" cy="13" r="3" />
                                </svg>
                                Bukti Pendukung
                            </h3>
                            <div v-if="laporan.foto_bukti && laporan.foto_bukti.length > 0">
                                <SButton label="Lihat Bukti Pendukung" variant="primary" class="w-full justify-center"
                                    @click="showBuktiDialog = true" />
                            </div>
                            <div v-else class="empty-state">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" class="empty-icon">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                                <p>Tidak ada bukti pendukung</p>
                            </div>
                        </SCard>

                        <!-- Card: Riwayat Status -->
                        <SCard class="card-section">
                            <h3 class="stf-page-subtitle">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="icon-blue">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                Riwayat Status
                            </h3>

                            <div v-if="laporan.riwayat_status && laporan.riwayat_status.length > 0" class="timeline">
                                <div v-for="(riwayat, index) in laporan.riwayat_status" :key="index"
                                    class="timeline-item">
                                    <span class="timeline-dot" :class="{
                                        'dot--menunggu': riwayat.status === 'menunggu',
                                        'dot--diproses': riwayat.status === 'diproses',
                                        'dot--selesai': riwayat.status === 'selesai',
                                        'dot--merah': riwayat.status === 'dibatalkan' || riwayat.status === 'ditolak',
                                        'dot--abu': !['menunggu', 'diproses', 'selesai', 'dibatalkan', 'ditolak'].includes(riwayat.status)
                                    }"></span>
                                    <div class="timeline-content">
                                        <div class="timeline-row">
                                            <span class="timeline-status">{{ statusLabel(riwayat.status) }}</span>
                                            <span class="timeline-date">{{ formatDate(riwayat.waktu) }}</span>
                                        </div>
                                        <p v-if="riwayat.catatan" class="timeline-catatan">{{ riwayat.catatan }} oleh {{
                                            riwayat.diubah_oleh_nama }}</p>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="empty-state">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                    stroke-linejoin="round" class="empty-icon">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <p>Belum ada riwayat status</p>
                            </div>
                        </SCard>
                    </div>

                    <!-- ══ Sidebar ══ -->
                    <div class="side-col">

                        <!-- Card: Info Pelapor -->
                        <SCard class="card-section">
                            <h3 class="stf-page-subtitle">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="icon-blue">
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                Informasi Pelapor
                            </h3>

                            <div class="pelapor-body">
                                <div class="info-field">
                                    <span class="info-label">Nama Pelapor</span>
                                    <span class="info-value">{{ pengirimNama }}</span>
                                </div>
                                <div class="info-field">
                                    <span class="info-label">Kelas</span>
                                    <span class="info-value">{{ kelasPengirim }}</span>
                                </div>

                                <div v-if="isKemahasiswaan" class="info-field">
                                    <span class="info-label">Status Akun Pelapor</span>
                                    <span class="info-verified" :class="laporan?.akun_terverifikasi ? 'verified--yes' : 'verified--no'">
                                        <svg v-if="laporan?.akun_terverifikasi" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                                        {{ laporan?.akun_terverifikasi ? 'Terverifikasi' : 'Belum Terverifikasi' }}
                                    </span>
                                </div>
                            </div>
                        </SCard>

                        <!-- Card: Tindak Lanjut -->
                        <SCard class="card-section card-action">
                            <h3 class="card-subtitle card-subtitle--blue">Tindak Lanjut Laporan</h3>

                            <div v-if="isPelapor" class="flex flex-col gap-3">
                                <template v-if="laporan.status === 'menunggu'">
                                    <SButton label="Edit Laporan" variant="primary" class="w-full justify-center"
                                        @click="$router.push({ name: 'editLaporanKerusakan', params: { id: laporan.id } })" />
                                    <SButton label="Batalkan Laporan" variant="danger" class="w-full justify-center"
                                        @click="showBatalkanDialog = true" />
                                </template>
                                <template v-else>
                                    <p class="action-note">Laporan ini sedang diproses atau telah selesai/dibatalkan.
                                        Laporan tidak dapat dihapus lagi.</p>
                                </template>
                            </div>

                            <div v-else class="flex flex-col gap-3">
                                <SButton label="Ubah Status Laporan" variant="primary" class="w-full justify-center"
                                    @click="$router.push(`/ubah-status-kerusakan/${laporan.id}`)" />
                            </div>
                        </SCard>
                    </div>
                </div>
            </template>
        </div>

        <!-- ══ Modals ══ -->
        <SDialog :visible="showBatalkanDialog" variant="danger" title="Batalkan Laporan"
            @update:visible="showBatalkanDialog = $event" @close="showBatalkanDialog = false">
            <div class="dialog-body">
                <p class="dialog-text">Apakah Anda yakin ingin membatalkan laporan ini? Tindakan ini tidak dapat
                    diurungkan.</p>
                <div>
                    <label class="dialog-label">Alasan Pembatalan (Min. 50 Karakter)</label>
                    <textarea v-model="alasanPembatalan" class="dialog-textarea"
                        placeholder="Masukkan alasan yang jelas mengapa laporan dibatalkan..."></textarea>
                    <p class="dialog-char-count">{{ alasanPembatalan.length }} karakter</p>
                </div>
            </div>
            <template #actions>
                <div class="dialog-actions">
                    <SButton label="Batal" variant="secondary" @click="showBatalkanDialog = false" />
                    <SButton label="Ya, Batalkan" variant="danger" @click="handleBatalkan"
                        :disabled="alasanPembatalan.length < 50" />
                </div>
            </template>
        </SDialog>

        <SDialog :visible="showBuktiDialog" variant="primary" title="Bukti Pendukung"
            @update:visible="showBuktiDialog = $event" @close="showBuktiDialog = false">
            <div class="bukti-scroll">
                <div v-for="bukti in laporan?.foto_bukti || []" :key="bukti.id" class="bukti-item">
                    <a :href="formatImageUrl(bukti.foto)" target="_blank" class="bukti-link">
                        <img :src="formatImageUrl(bukti.foto)" alt="Bukti Pendukung" class="bukti-img" loading="lazy" />
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
    padding: 8px;
}
.bukti-link { display: flex; justify-content: center; width: 100%; }
.bukti-img  { max-width: 100%; height: auto; border-radius: 6px; object-fit: contain; }

/* ─── Utility classes ─── */
.w-full { width: 100%; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.gap-3 { gap: 0.75rem; }
.justify-center { justify-content: center; }

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
    .stf-page-subtitle { font-size: 12px; margin-bottom: 12px; }
    .card-subtitle { font-size: 12px; margin-bottom: 12px; }

    /* Timeline */
    .timeline-status { font-size: 12px; }
    .timeline-date   { font-size: 10px; }
    .timeline-catatan{ font-size: 12px; padding: 8px 10px; }

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
}

/* ── Very small (≤ 360px) ── */
@media (max-width: 360px) {
    .header-title { font-size: 14px; }
    .meta-grid { grid-template-columns: 1fr; }
    .card-section { padding: 12px; }
    .laporan-judul { font-size: 14px; }
}
</style>