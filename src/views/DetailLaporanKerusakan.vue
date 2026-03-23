<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SButton from '@/components/SButton.vue'
import SCard from '@/components/SCard.vue'
import SModal from '@/components/SModal.vue'
import SDialog from '@/components/SDialog.vue'
import STextField from '@/components/STextField.vue'
import SAlert from '@/components/SAlert.vue'
import SChip from '@/components/SChip.vue'
import { useAuthStore } from '@/stores/auth'
import { useLaporanKerusakanStore } from '@/stores/laporanKerusakan'
import { useAlertStore } from '@/stores/alert'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const laporanStore = useLaporanKerusakanStore()
const alertStore = useAlertStore()

const laporan = ref<any | null>(null)
const loadError = ref('')

const fotoModalVisible = ref(false)
const fotoModalUrl = ref('')

// Cancel dialog state
const cancelDialogVisible = ref(false)
const alasanPembatalan = ref('')
const alasanError = ref('')

function openFoto(url: string) {
    fotoModalUrl.value = url
    fotoModalVisible.value = true
}

function openCancelDialog() {
    alasanPembatalan.value = ''
    alasanError.value = ''
    cancelDialogVisible.value = true
}

async function submitCancel() {
    alasanError.value = ''
    if (!alasanPembatalan.value || alasanPembatalan.value.trim().length === 0) {
        alasanError.value = 'Alasan pembatalan wajib diisi'
        return
    }
    if (alasanPembatalan.value.trim().length < 50) {
        alasanError.value = 'Alasan pembatalan wajib minimal 50 karakter'
        return
    }

    try {
        const id = route.params.id as string
        await laporanStore.cancelLaporanKerusakan(id, alasanPembatalan.value.trim())
        laporan.value = laporanStore.currentLaporan
        cancelDialogVisible.value = false
        alertStore.show({
            type: 'default',
            title: 'Laporan Dibatalkan',
            message: 'Laporan berhasil dibatalkan'
        })
        // Note: the original had a router.push onPrimary, but SAlert in App.vue 
        // currently only closes the alert. If we need navigation, we might need 
        // to add callback support to alertStore.
    } catch (error: any) {
        alertStore.error(error?.message || 'Terjadi kesalahan. Silakan coba lagi.', 'Gagal Membatalkan Laporan')
    }
}


const isKemahasiswaan = computed(() => auth.user?.role === 'kemahasiswaan')
const isPelapor = computed(() => !isKemahasiswaan.value)

function statusLabel(s: string) {
    const map: Record<string, string> = {
        menunggu: 'Menunggu Verifikasi',
        diproses: 'Diproses',
        selesai: 'Selesai',
        ditolak: 'Ditolak',
        dibatalkan: 'Dibatalkan',
    }
    return map[s] || s
}

function statusTone(status: string): 'warning' | 'info' | 'success' | 'danger' {
    if (status === 'menunggu') return 'warning'
    if (status === 'diproses') return 'info'
    if (status === 'selesai') return 'success'
    return 'danger'
}

function formatDate(d: string) {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDatetime(d: string) {
    if (!d) return '-'
    return new Date(d).toLocaleString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

const fotoList = computed<{ url: string }[]>(() => {
    if (laporan.value?.foto_bukti?.length) {
        return laporan.value.foto_bukti.map((f: any) => ({ url: f.foto }))
    }
    if (laporan.value?.foto_pendukung?.length) {
        return laporan.value.foto_pendukung.map((url: string) => ({ url }))
    }
    return []
})

const pengirimNama = computed(() => laporan.value?.nama_lengkap || 'Pengguna Anonim')
const kelasPengirim = computed(() => laporan.value?.kelas_pengirim || '-')
// ... (lines 95-141)
onMounted(async () => {
    const id = route.params.id as string
    try {
        await laporanStore.fetchLaporanDetail(id)
        laporan.value = laporanStore.currentLaporan
    } catch (err: any) {
        const msg = err.message || ''
        if (msg.includes('403') || msg.toLowerCase().includes('akses')) {
            alertStore.error('Akses ditolak')
            router.replace('/laporan-kerusakan')
        } else if (msg.includes('401')) {
            router.replace('/login')
        } else {
            loadError.value = msg || 'Gagal memuat laporan'
        }
    }
})
</script>

<template>
    <div class="stf-page">
        <div class="laporan-container">

            <div v-if="loadError" class="feedback-state">
                <p class="feedback-text">{{ loadError }}</p>
                <SButton label="Kembali" variant="ghost" @click="router.push({ name: 'laporanKerusakan' })" />
            </div>

            <div v-else-if="!laporan" class="feedback-state">
                <p class="feedback-text">Memuat data laporan...</p>
            </div>

            <template v-else>
                <div class="laporan-header">
                    <button @click="router.back()" class="back-btn" aria-label="Kembali">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <div class="header-content">
                        <h1 class="stf-page-title">Detail Laporan Kerusakan</h1>
                        <p class="stf-page-subtitle">{{ laporan.no_laporan }}</p>
                    </div>
                </div>

                <!-- Card 1: Status -->
                <SCard class="section-card">
                    <h3 class="stf-section-title">Status</h3>
                    <div class="status-row">
                        <SChip size="large" variant="solid" :tone="statusTone(laporan.status)" :label="statusLabel(laporan.status)" />
                        <span class="status-updated">Terakhir diperbarui: {{ formatDatetime(laporan.updated_at || laporan.tanggal_laporan) }}</span>
                    </div>
                </SCard>

                <!-- Card 2: Detail fields -->
                <SCard class="section-card">

                    <template v-if="isKemahasiswaan">
                        <div class="field-group">
                            <STextField
                                label="ID Laporan"
                                :modelValue="laporan.id"
                                :disabled="true"
                            />
                        </div>
                    </template>

                    <div class="field-group">
                        <STextField
                            label="Judul Laporan"
                            :modelValue="laporan.judul"
                            :disabled="true"
                        />
                    </div>

                    <div class="field-row-two">
                        <div class="field-group">
                            <STextField
                                label="Tanggal Kejadian"
                                :modelValue="formatDate(laporan.tanggal_kejadian)"
                                :disabled="true"
                            />
                        </div>
                        <div class="field-group">
                            <STextField
                                label="Lokasi Kejadian"
                                :modelValue="laporan.lokasi"
                                :disabled="true"
                            />
                        </div>
                    </div>

                    <div class="field-group">
                        <STextField
                            label="Deskripsi Kejadian"
                            variant="textarea"
                            :modelValue="laporan.deskripsi"
                            :disabled="true"
                        />
                    </div>

                    <div class="field-row-two">
                        <div class="field-group">
                            <STextField
                                label="Pengirim"
                                :modelValue="pengirimNama"
                                :disabled="true"
                            />
                        </div>
                        <div class="field-group">
                            <STextField
                                label="Kelas"
                                :modelValue="kelasPengirim"
                                :disabled="true"
                            />
                        </div>
                    </div>

                    <div class="field-group">
                        <label class="field-label">Bukti Pendukung</label>
                        <div v-if="fotoList.length > 0" class="foto-grid">
                            <div v-for="(foto, idx) in fotoList" :key="idx" class="foto-item">
                                <img :src="foto.url" :alt="`Bukti ${idx + 1}`" class="foto-thumb" />
                                <button class="lihat-berkas-btn" @click="openFoto(foto.url)">
                                    Lihat Berkas
                                </button>
                            </div>
                        </div>
                        <p v-else class="field-value field-value--empty">Tidak ada foto bukti pendukung.</p>
                    </div>

                </SCard>

                <SCard class="section-card">
                    <h3 class="stf-section-title">Riwayat Status</h3>
                    <div v-if="laporan.riwayat_status && laporan.riwayat_status.length" class="riwayat-list">
                        <div
                            v-for="(r, idx) in laporan.riwayat_status"
                            :key="r.id"
                            class="riwayat-item"
                        >
                            <div class="riwayat-dot" :class="`dot--${r.status}`"></div>
                            <div class="riwayat-connector" v-if="(idx as number) < laporan.riwayat_status.length - 1"></div>
                            <div class="riwayat-content">
                                <SChip class="self-start" size="small" variant="solid" :tone="statusTone(r.status)" :label="statusLabel(r.status)" />
                                <p class="riwayat-catatan" v-if="r.catatan">{{ r.catatan }}</p>
                                <div class="riwayat-meta">
                                    <span>{{ formatDatetime(r.waktu) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p v-else class="field-value field-value--empty">Tidak ada riwayat status.</p>
                </SCard>

                <!-- Pelapor: Batalkan + Ubah (row 1), Kembali (row 2) -->
                <div v-if="isPelapor" class="action-bar action-bar--pelapor">
                    <div v-if="laporan.status === 'menunggu'" class="action-bar__top">
                        <SButton
                            label="Batalkan Laporan"
                            variant="primary"
                            class="btn-danger"
                            @click="openCancelDialog"
                        />
                        <SButton
                            label="Ubah Laporan"
                            variant="primary"
                            @click="$router.push({name:'editLaporanKerusakan', params: { id: laporan.id }})"
                        />
                    </div>
                    <SButton
                        label="Kembali"
                        variant="ghost"
                        class="btn-full"
                        @click="router.push({ name: 'laporanKerusakan' })"
                    />
                </div>
                <!-- Kemahasiswaan: Kembali + Ubah Status (single row) -->
                <div v-else class="action-bar">
                    <SButton
                        label="Kembali"
                        variant="ghost"
                        @click="router.push({ name: 'laporanKerusakan' })"
                    />
                    <SButton
                        label="Ubah Status Laporan"
                        variant="primary"
                        @click="$router.push(`/ubah-status-kerusakan/${laporan.id}`)"
                    />
                </div>
            </template>
        </div>

        <SDialog
            :visible="cancelDialogVisible"
            title="Konfirmasi Pembatalan"
            confirmLabel="Ya, Batalkan"
            cancelLabel="Kembali"
            variant="danger"
            @update:visible="cancelDialogVisible = $event"
            @confirm="submitCancel"
            @cancel="cancelDialogVisible = false"
        >
            <!-- ini kalau mau dimasukin component sdialog/bikin baru boleh ya -->
            <div class="dialog-body-content">
                <p class="text-general-black subheading-s7 text-center dialog-text">Apakah anda yakin untuk membatalkan laporan ini? Mohon berikan alasan pembatalan</p>
                <STextField
                    label="Alasan Pembatalan"
                    variant="textarea"
                    :modelValue="alasanPembatalan"
                    @update:modelValue="(v) => (alasanPembatalan = v)"
                />
                <p v-if="alasanError" style="color:var(--color-general-red,#DC2626);font-size:13px;margin-top:8px">{{ alasanError }}</p>
            </div>
        </SDialog>

        <SModal :visible="fotoModalVisible" title="Bukti Pendukung" @update:visible="fotoModalVisible = $event">
            <div class="foto-modal-content">
                <img :src="fotoModalUrl" alt="Foto Bukti" class="foto-modal-img" />
            </div>
        </SModal>
    </div>
</template>

<style scoped>
.laporan-page {
    min-height: calc(100vh - 64px);
    background: var(--color-general-frame);
    padding: 24px 16px;
}

.laporan-container {
    max-width: 1100px;
    margin: 0 auto;
}

.laporan-header {
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

.back-btn:hover {
    background: #f9fafb;
}

.header-content {
    display: flex;
    flex-direction: column;
}

.laporan-title {
    font-family: var(--font-be-vietnam, "Be Vietnam Pro", sans-serif);
    font-weight: 700;
    font-size: 24px;
    color: var(--color-blue-500, #2E3094);
    margin-bottom: 4px;
}

.laporan-subtitle {
    font-family: "Be Vietnam Pro", sans-serif;
    font-size: 14px;
    color: var(--color-neutral-500, #6B7280);
    margin: 0;
}

.section-card {
    margin-bottom: 20px;
}

.section-title {
    font-family: "Be Vietnam Pro", sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--color-general-black, #1E1E2D);
    margin: 0 0 16px 0;
}

.status-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
}

.status-updated {
    font-family: "Be Vietnam Pro", sans-serif;
    font-size: 12px;
    color: var(--color-neutral-400, #9CA3AF);
}

.field-group {
    margin-bottom: 20px;
}

.field-group:last-child {
    margin-bottom: 0;
}

.field-row-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

@media (max-width: 600px) {
    .field-row-two {
        grid-template-columns: 1fr;
    }
}


.field-label {
    display: block;
    font-family: "Be Vietnam Pro", sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-general-black, #333333);
    margin-bottom: 6px;
    letter-spacing: 0.04em;
}

.section-card :deep(input:disabled),
.section-card :deep(textarea:disabled) {
    color: var(--color-general-black, #1E1E2D) !important;
    opacity: 1 !important;
}

.field-value {
    font-family: "Be Vietnam Pro", sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: var(--color-general-black, #1E1E2D);
    margin: 0;
    line-height: 1.5;
}

.field-value--pre {
    white-space: pre-wrap;
}

.field-value--empty {
    color: var(--color-neutral-400, #9CA3AF);
    font-size: 13px;
    font-weight: 400;
}

.foto-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    margin-top: 8px;
}

.foto-item {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.foto-thumb {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid var(--color-general-border, #D9D9D9);
}

.lihat-berkas-btn {
    font-family: "Be Vietnam Pro", sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-blue-500, #2E3094);
    background: var(--color-blue-50, #EAEAF4);
    border: 1px solid var(--color-blue-500, #2E3094);
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    transition: background 0.15s;
    text-align: center;
}

.lihat-berkas-btn:hover {
    background: var(--color-blue-100, #d0d0f0);
}

.riwayat-list {
    display: flex;
    flex-direction: column;
}

.riwayat-item {
    display: flex;
    gap: 12px;
    position: relative;
    padding-bottom: 20px;
}

.riwayat-item:last-child {
    padding-bottom: 0;
}

.riwayat-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px;
    border: 2px solid transparent;
}

.dot--menunggu { background: #F59E0B; border-color: #F59E0B; }
.dot--diproses  { background: var(--color-blue-500, #2E3094); border-color: var(--color-blue-500, #2E3094); }
.dot--selesai   { background: #2E7D32; border-color: #2E7D32; }
.dot--ditolak   { background: #DC2626; border-color: #DC2626; }
.dot--dibatalkan   { background: #DC2626; border-color: #DC2626; }

.riwayat-connector {
    position: absolute;
    left: 5px;
    top: 18px;
    bottom: 0;
    width: 2px;
    background: var(--color-general-border, #D9D9D9);
}

.dialog-text {
  margin-bottom: 20px;
}

.riwayat-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.riwayat-catatan {
    font-family: "Be Vietnam Pro", sans-serif;
    font-size: 13px;
    color: var(--color-neutral-600, #4B5563);
    margin: 2px 0 0;
}

.riwayat-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-family: "Be Vietnam Pro", sans-serif;
    font-size: 11px;
    color: var(--color-neutral-400, #9CA3AF);
}

.action-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
}

.action-bar :deep(button) {
    flex: 1;
}

.action-bar--pelapor {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-top: 8px;
}

.action-bar__top {
    display: flex;
    gap: 12px;
}

.action-bar__top :deep(button) {
    flex: 1;
}

.btn-full {
    width: 100%;
}

@media (max-width: 600px) {
    .action-bar {
        flex-direction: column;
    }

    .action-bar :deep(button) {
        width: 100%;
    }

    .action-bar__top {
        flex-direction: column;
    }
}

.btn-danger {
    background: var(--color-general-red, #DC2626) !important;
    border-color: var(--color-general-red, #DC2626) !important;
    color: white !important;
}

.btn-danger:hover {
    background: #f87171 !important;
    border-color: #f87171 !important;
}

/* Status badges removed */

.feedback-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px 24px;
    text-align: center;
}

.feedback-text {
    font-family: "Be Vietnam Pro", sans-serif;
    font-size: 15px;
    color: var(--color-neutral-500, #6B7280);
    margin: 0;
}

.foto-modal-content {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    max-height: 70vh;
    overflow: auto;
}

.foto-modal-img {
    max-width: 100%;
    max-height: 65vh;
    border-radius: 8px;
    object-fit: contain;
}
</style>