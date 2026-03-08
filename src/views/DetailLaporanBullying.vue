<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLaporanBullyingStore } from '@/stores/laporanBullying'
import { toast } from 'vue-sonner'
import SCard from '@/components/SCard.vue'
import SButton from '@/components/SButton.vue'
import SDialog from '@/components/SDialog.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const laporanStore = useLaporanBullyingStore()


const id = route.params.id as string
const loading = ref(true)

const laporan = computed(() => laporanStore.detailLaporan)
const isGuruBk = computed(() => authStore.user?.role === 'guru_bk')
const isKemahasiswaan = computed(() => authStore.user?.role === 'kemahasiswaan')
const isAdmin = computed(() => isGuruBk.value || isKemahasiswaan.value)
const isPelapor = computed(() => !isAdmin.value && laporan.value?.pelapor === authStore.user?.id)

// Dialog states
const showBatalkanDialog = ref(false)
const showProsesDialog = ref(false)
const showTolakDialog = ref(false)
const showSelesaiDialog = ref(false)
const showBuktiDialog = ref(false)

const alasanPembatalan = ref('')
const responseGuruBk = ref('')
const alasanPenolakan = ref('')

async function fetchDetail() {
    loading.value = true
    try {
        await laporanStore.ambilDetail(id)
    } catch (error) {
        toast.error('Gagal memuat detail laporan')
        router.push('/laporan')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchDetail()
})

function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }
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

// Actions
async function handleBatalkan() {
    if (!alasanPembatalan.value || alasanPembatalan.value.length < 50) {
        toast.error('Alasan pembatalan wajib diisi minimal 50 karakter')
        return
    }

    try {
        await laporanStore.batalkanLaporan(id, alasanPembatalan.value)
        toast.success('Laporan berhasil dibatalkan')
        showBatalkanDialog.value = false
        fetchDetail()
    } catch (error) {
        // Error is handled in store
    }
}

async function handleProses() {
    try {
        // Implementasi logika proses dari store. (diambil dari api route yg ada)
        // await laporanStore.editLaporan(id, { status: 'diproses' }) dsb...
        toast.success('Status laporan diubah menjadi diproses')
        showProsesDialog.value = false
        fetchDetail()
    } catch (error) {
    }
}

async function handleTolak() {
    if (!alasanPenolakan.value) {
        toast.error('Alasan penolakan wajib diisi')
        return
    }

    try {
        // await laporanStore.editLaporan(id, { status: 'ditolak', alasan_penolakan: alasanPenolakan.value })
        toast.success('Laporan berhasil ditolak')
        showTolakDialog.value = false
        fetchDetail()
    } catch (error) {
    }
}

async function handleSelesai() {
    try {
        // await laporanStore.editLaporan(id, { status: 'selesai', tindak_lanjut: responseGuruBk.value })
        toast.success('Laporan ditandai selesai')
        showSelesaiDialog.value = false
        fetchDetail()
    } catch (error) {
    }
}

</script>

<template>
  <div class="laporan-detail-page p-6 md:p-8">
    <div class="max-w-4xl mx-auto">
        <!-- Header Section -->
        <div class="mb-6 flex items-center gap-4">
            <button @click="router.back()" class="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
                <h1 class="text-2xl font-bold font-display text-[var(--color-general-black)]">Detail Laporan Bullying</h1>
                <p class="text-gray-500 font-display text-sm mt-1">Lihat detail dan tanggapi laporan bullying di bawah ini.</p>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center items-center h-64">
            <p class="text-gray-500 font-display">Memuat detail laporan...</p>
        </div>

        <template v-else-if="laporan">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Main Content (Left) -->
                <div class="md:col-span-2 space-y-6">
                    <SCard class="p-6">
                        <div class="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h2 class="text-xl font-bold font-display text-[var(--color-general-black)]">{{ laporan.judul }}</h2>
                                <p class="text-sm text-gray-500 font-display mt-2">{{ laporan.no_laporan }}</p>
                            </div>
                            <span class="status-badge" :class="`status-badge--${laporan.status}`">
                                {{ statusLabel(laporan.status) }}
                            </span>
                        </div>

                        <div class="space-y-6">
                            <div>
                                <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 font-display">Isi Laporan</h3>
                                <div class="bg-gray-50 p-4 rounded-lg font-display text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-100 break-words break-all">
                                    {{ laporan.deskripsi }}
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div class="flex flex-col gap-1 p-3 bg-white rounded-lg border border-gray-100">
                                    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider font-display">Jenis Bullying</h3>
                                    <p class="text-sm text-[var(--color-general-black)] font-display">{{ laporan.jenis_bullying }}</p>
                                </div>
                                <div class="flex flex-col gap-1 p-3 bg-white rounded-lg border border-gray-100">
                                    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider font-display">Lokasi Kejadian</h3>
                                    <p class="text-sm text-[var(--color-general-black)] font-display">{{ laporan.lokasi }}</p>
                                </div>
                                <div class="flex flex-col gap-1 p-3 bg-white rounded-lg border border-gray-100">
                                    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider font-display">Tanggal Kejadian</h3>
                                    <p class="text-sm text-[var(--color-general-black)] font-display">{{ formatDate(laporan.tanggal_kejadian) }}</p>
                                </div>
                                <div class="flex flex-col gap-1 p-3 bg-white rounded-lg border border-gray-100">
                                    <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider font-display">Tanggal Lapor</h3>
                                    <p class="text-sm text-blue-600 font-display">{{ formatDate(laporan.tanggal_laporan) }}</p>
                                </div>
                            </div>
                        </div>
                    </SCard>

                    <!-- Bukti Lampiran -->
                    <SCard class="p-6">
                        <h3 class="text-sm font-semibold text-gray-800 mb-4 font-display flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                            Bukti Pendukung
                        </h3>
                        <div v-if="laporan.foto_bukti && laporan.foto_bukti.length > 0" class="flex flex-col gap-4">
                            <SButton label="Lihat Bukti Pendukung" variant="primary" class="w-full justify-center" @click="showBuktiDialog = true" />
                        </div>
                        <div v-else class="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center flex flex-col items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            <p class="text-sm text-gray-500 font-display">Tidak ada bukti pendukung</p>
                        </div>
                    </SCard>

                    <!-- Riwayat Status Laporan -->
                    <SCard class="p-6">
                        <h3 class="text-sm font-semibold text-gray-800 mb-4 font-display flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Riwayat Status
                        </h3>
                        
                        <div v-if="laporan.riwayat_status && laporan.riwayat_status.length > 0" class="relative border-l-2 border-gray-100 ml-2 space-y-6 pb-2 mt-2">
                            <div v-for="(riwayat, index) in laporan.riwayat_status" :key="index" class="relative pl-6">
                                <span class="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white" :class="{
                                    'bg-yellow-400': riwayat.status === 'menunggu',
                                    'bg-blue-500': riwayat.status === 'diproses',
                                    'bg-green-500': riwayat.status === 'selesai',
                                    'bg-red-500': riwayat.status === 'dibatalkan' || riwayat.status === 'ditolak',
                                    'bg-gray-400': !['menunggu','diproses','selesai','dibatalkan','ditolak'].includes(riwayat.status)
                                }"></span>
                                <div class="flex flex-col gap-1">
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <span class="text-sm font-bold text-gray-800 font-display">{{ statusLabel(riwayat.status) }}</span>
                                        <span class="text-xs text-gray-500 font-display">{{ formatDate(riwayat.created_at) }}</span>
                                    </div>
                                    <p v-if="riwayat.catatan" class="text-sm text-gray-600 font-display mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">{{ riwayat.catatan }} oleh {{ riwayat.user?.nama }}</p>
                                </div>
                            </div>
                        </div>
                        <div v-else class="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center flex flex-col items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <p class="text-sm text-gray-500 font-display">Belum ada riwayat status</p>
                        </div>
                    </SCard>
                </div>

                <!-- Sidebar (Right) -->
                <div class="space-y-6">
                    <!-- Info Pelapor -->
                    <SCard class="p-6">
                        <h3 class="text-sm font-semibold text-gray-800 mb-4 font-display flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Informasi Pelapor
                        </h3>
                        
                        <div class="space-y-4">
                            <div v-if="laporan.anonimitas" class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded text-sm font-display flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                                <span>Laporan ini dikirim secara anonim. Identitas pelapor dilindungi.</span>
                            </div>
                            
                            <template v-else>
                                <div>
                                    <span class="text-xs text-gray-500 font-display block">Nama Pelapor</span>
                                    <span class="text-sm font-semibold text-gray-800 font-display">{{ laporan.nama_pengirim || '-' }}</span>
                                </div>
                                <div>
                                    <span class="text-xs text-gray-500 font-display block">Kelas / Angkatan</span>
                                    <span class="text-sm text-gray-800 font-display">{{ laporan.kelas || '-' }}</span>
                                </div>
                            </template>

                            <div v-if="isAdmin">
                                <span class="text-xs text-gray-500 font-display block">Status Akun Pelapor</span>
                                <span class="text-sm font-display inline-flex items-center gap-1 mt-1" :class="laporan.is_verified ? 'text-green-600' : 'text-red-600'">
                                    <svg v-if="laporan.is_verified" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                                    {{ laporan.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi' }}
                                </span>
                            </div>
                        </div>
                    </SCard>

                    <!-- Aksi Action Bar -->
                    <SCard class="p-6 bg-[var(--color-blue-50)] border border-[var(--color-blue-100)]">
                        <h3 class="text-sm font-semibold text-[var(--color-blue-800)] mb-4 font-display">Tindak Lanjut Laporan</h3>
                       
                        <div v-if="isPelapor" class="space-y-3">
                            <template v-if="laporan.status === 'menunggu'">
                                <SButton label="Batalkan Laporan" variant="danger" class="w-full justify-center" @click="showBatalkanDialog = true" />
                            </template>
                            
                            <template v-else>
                                <p class="text-sm text-gray-500 italic font-display">Laporan ini sedang diproses atau telah selesai/dibatalkan. Laporan tidak dapat dihapus lagi.</p>
                            </template>
                        </div>
                    </SCard>
                </div>
            </div>
        </template>
    </div>

    <!-- Modals -->
    <!-- Modal Batalkan -->
    <SDialog :visible="showBatalkanDialog" variant="danger" title="Batalkan Laporan" @update:visible="showBatalkanDialog = $event" @close="showBatalkanDialog = false">
        <div class="space-y-4 font-display">
            <p class="text-sm text-gray-600">Apakah Anda yakin ingin membatalkan laporan ini? Tindakan ini tidak dapat diurungkan.</p>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Alasan Pembatalan (Min. 50 Karakter)</label>
                <textarea v-model="alasanPembatalan" class="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 min-h-[100px]" placeholder="Masukkan alasan yang jelas mengapa laporan dibatalkan..."></textarea>
                <p class="text-xs text-gray-500 mt-1 text-right">{{ alasanPembatalan.length }} karakter</p>
            </div>
        </div>
        <template #actions>
            <div class="flex gap-2 justify-end w-full">
                <SButton label="Batal" variant="secondary" @click="showBatalkanDialog = false" />
                <SButton label="Ya, Batalkan" variant="danger" @click="handleBatalkan" :disabled="alasanPembatalan.length < 50" />
            </div>
        </template>
    </SDialog>

    <!-- Modal Proses Admin (Dummy UI pending API) -->
    <SDialog :visible="showProsesDialog" variant="primary" title="Proses Laporan" @update:visible="showProsesDialog = $event" @close="showProsesDialog = false">
        <p class="text-sm text-gray-600 font-display">Ubah status laporan menjadi "Sedang Diproses"? Laporan ini akan masuk ke antrean investigasi dan konseling.</p>
        <template #actions>
            <div class="flex gap-2 justify-end w-full">
                <SButton label="Batal" variant="secondary" @click="showProsesDialog = false" />
                <SButton label="Ya, Proses" variant="primary" @click="handleProses" />
            </div>
        </template>
    </SDialog>

    <SDialog :visible="showSelesaiDialog" variant="primary" title="Tandai Laporan Selesai" @update:visible="showSelesaiDialog = $event" @close="showSelesaiDialog = false">
        <div class="space-y-4 font-display">
            <p class="text-sm text-gray-600">Apakah kasus bullying ini sudah diselesaikan? Silakan tambahkan catatan penyelesaian (Opsional).</p>
            <textarea v-model="responseGuruBk" class="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[100px]" placeholder="Catatan hasil mediasi/konseling..."></textarea>
        </div>
        <template #actions>
            <div class="flex gap-2 justify-end w-full">
                <SButton label="Batal" variant="secondary" @click="showSelesaiDialog = false" />
                <SButton label="Tandai Selesai" variant="primary" class="bg-green-600 border-green-600 hover:bg-green-700" @click="handleSelesai" />
            </div>
        </template>
    </SDialog>

    <!-- Modal Bukti Pendukung -->
    <SDialog :visible="showBuktiDialog" variant="primary" title="Bukti Pendukung" @update:visible="showBuktiDialog = $event" @close="showBuktiDialog = false">
        <div class="space-y-4 max-h-[60vh] overflow-y-auto px-1 py-2 custom-scrollbar">
            <div v-for="bukti in laporan.foto_bukti" :key="bukti.id" class="rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex justify-center items-center p-2 relative">
                <a :href="formatImageUrl(bukti.foto)" target="_blank" class="w-full h-full flex justify-center items-center" title="Klik untuk membuka ukuran penuh">
                    <img :src="formatImageUrl(bukti.foto)" alt="Bukti Pendukung" class="max-w-full h-auto rounded object-contain" loading="lazy" />
                </a>
            </div>
        </div>
        <template #actions>
            <div class="flex justify-end w-full">
                <SButton label="Tutup" variant="secondary" @click="showBuktiDialog = false" />
            </div>
        </template>
    </SDialog>
  </div>
</template>

<style scoped>
.laporan-detail-page {
    min-height: calc(100vh - 64px);
    background: var(--color-general-frame);
}

.font-display {
    font-family: "Be Vietnam Pro", sans-serif;
}

.status-badge {
	display: inline-flex;
	align-items: center;
	padding: 6px 14px;
	border-radius: 9999px;
	font-size: 13px;
	font-weight: 600;
	font-family: "Be Vietnam Pro", sans-serif;
	white-space: nowrap;
}

.status-badge--menunggu {
	background: #FFF8E1;
	color: #F59E0B;
	border: 1px solid #F59E0B;
}

.status-badge--diproses {
	background: var(--color-blue-50);
	color: var(--color-blue-600);
	border: 1px solid var(--color-blue-400);
}

.status-badge--selesai {
	background: #E8F5E9;
	color: #2E7D32;
	border: 1px solid #2E7D32;
}

.status-badge--dibatalkan, .status-badge--ditolak {
	background: var(--color-red-50);
	color: #DC2626;
	border: 1px solid #DC2626;
}
</style>
