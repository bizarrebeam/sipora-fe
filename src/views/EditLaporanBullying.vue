<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import STextField from '@/components/STextField.vue'
import SToggle from '@/components/SToggle.vue'
import SButton from '@/components/SButton.vue'
import SAlert from '@/components/SAlert.vue'
import SDatePicker from '@/components/SDatePicker.vue'
import { useLaporanBullyingStore } from '@/stores/laporanBullying'
import { useNotFoundStore } from '@/stores/notFound'

const router = useRouter()
const route = useRoute()
const laporanStore = useLaporanBullyingStore()

const alertVisible = ref(false)
const alertType = ref<'default' | 'warning' | 'no-header'>('default')
const alertTitle = ref('')
const alertDescription = ref('')
let alertOnPrimary: (() => void) | null = null

function showAlert(opts: { type?: 'default' | 'warning' | 'no-header'; title?: string; description: string; onPrimary?: () => void }) {
    alertType.value = opts.type ?? 'default'
    alertTitle.value = opts.title ?? ''
    alertDescription.value = opts.description
    alertOnPrimary = opts.onPrimary ?? null
    alertVisible.value = true
}

function handleAlertPrimary() {
    alertVisible.value = false
    if (alertOnPrimary) alertOnPrimary()
}

const judul = ref('')
const tanggalKejadian = ref('')
const waktuKejadian = ref('')
const tanggalKejadianObj = ref<Date | null>(null)
const showDatePicker = ref(false)
const lokasi = ref('')
const jenisBullying = ref('')
const deskripsi = ref('')
const anonimitas = ref(false)
const buktiPendukung = ref<File[]>([])
const buktiError = ref('')
const buktiInputRef = ref<HTMLInputElement | null>(null)

watch(tanggalKejadianObj, (newVal) => {
  if (newVal) {
    const yyyy = newVal.getFullYear()
    const mm = String(newVal.getMonth() + 1).padStart(2, '0')
    const dd = String(newVal.getDate()).padStart(2, '0')
    tanggalKejadian.value = `${yyyy}-${mm}-${dd}`
    showDatePicker.value = false
    validate()
  }
})

const jenisBullyingOptions = [
    { value: 'verbal', label: 'Bullying Verbal' },
    { value: 'fisik', label: 'Bullying Fisik' },
    { value: 'sosial', label: 'Bullying Sosial' },
    { value: 'cyber', label: 'Cyberbullying' },
    { value: 'seksual', label: 'Kekerasan Seksual' },
    { value: 'lainnya', label: 'Lainnya' },
]

const errors = ref({
    judul: '',
    tanggalKejadian: '',
    lokasi: '',
    jenisBullying: '',
    deskripsi: '',
})

onMounted(async () => {
    const id = route.params.id as string
    if (!id) return

    try {
        await laporanStore.ambilDetail(id)
        const laporan = laporanStore.detailLaporan
        if (laporan) {
            judul.value = laporan.judul || ''
            deskripsi.value = laporan.deskripsi || ''
            lokasi.value = laporan.lokasi || ''
            tanggalKejadian.value = laporan.tanggal_kejadian || ''
            waktuKejadian.value = laporan.waktu_kejadian || ''
            if (laporan.tanggal_kejadian) {
              tanggalKejadianObj.value = new Date(laporan.tanggal_kejadian)
            }
            jenisBullying.value = laporan.jenis_bullying || ''
            anonimitas.value = laporan.anonimitas || false
        }
    } catch (error: any) {
        const errorMsg = String(error?.message || error)
        if (useNotFoundStore().visible || errorMsg.includes('403') || errorMsg.includes('Akses ditolak') || errorMsg.includes('Forbidden') || error?.response?.status === 403) {
            router.replace('/laporan-bullying')
            return
        }

        showAlert({
            type: 'warning',
            title: 'Gagal Memuat Laporan',
            description: errorMsg || 'Data laporan tidak ditemukan.',
            onPrimary: () => router.push('/laporan-bullying')
        })
    }
})

const isFormValid = computed(() => {
    return (
        judul.value.trim() &&
        tanggalKejadian.value &&
        lokasi.value.trim() &&
        jenisBullying.value &&
        deskripsi.value.trim() &&
        !buktiError.value
    )
})

function validate() {
    errors.value.judul = !judul.value.trim() ? 'Judul wajib diisi' : ''
    errors.value.tanggalKejadian = !tanggalKejadian.value ? 'Tanggal wajib diisi' : ''
    errors.value.lokasi = !lokasi.value.trim() ? 'Lokasi wajib diisi' : ''
    errors.value.jenisBullying = !jenisBullying.value ? 'Jenis bullying wajib dipilih' : ''
    errors.value.deskripsi = !deskripsi.value.trim() ? 'Deskripsi wajib diisi' : ''
}

function triggerFileInput() {
    if (buktiInputRef.value) buktiInputRef.value.click();
}

function handleFileChange(e: Event) {
    const files = (e.target as HTMLInputElement).files
    buktiError.value = ''
    
    if (!files || files.length === 0) return
    
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    const newFiles: File[] = []
    
    if (buktiPendukung.value.length + files.length > 5) {
        buktiError.value = 'Maksimal 5 foto'
        if (buktiInputRef.value) buktiInputRef.value.value = ''
        return
    }
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file) continue
        
        if (!allowed.includes(file.type)) {
            buktiError.value = `Format ${file.name} tidak didukung`
            if (buktiInputRef.value) buktiInputRef.value.value = ''
            return
        }
        
        if (file.size > 5 * 1024 * 1024) {
            buktiError.value = `Ukuran ${file.name} maksimal 5 MB`
            if (buktiInputRef.value) buktiInputRef.value.value = ''
            return
        }
        
        newFiles.push(file)
    }
    
    buktiPendukung.value = [...buktiPendukung.value, ...newFiles]
    if (buktiInputRef.value) buktiInputRef.value.value = ''
}

function removeFile(index: number) {
    buktiPendukung.value.splice(index, 1)
    buktiError.value = ''
}

async function handleSubmit() {
    validate()
    if (!isFormValid.value) return

    const id = route.params.id as string
    if (!id) return

    try {
        await laporanStore.editLaporan(id, {
            judul: judul.value.trim(),
            deskripsi: deskripsi.value.trim(),
            lokasi: lokasi.value.trim(),
            tanggal_kejadian: tanggalKejadian.value,
            waktu_kejadian: waktuKejadian.value || undefined,
            jenis_bullying: jenisBullying.value,
            anonimitas: anonimitas.value,
            foto_bukti: buktiPendukung.value.length > 0 ? buktiPendukung.value : undefined,
        })
        
        router.replace(`/laporan-bullying/${id}`)
    } catch (error: any) {
        showAlert({
            type: 'warning',
            title: 'Gagal Mengedit Laporan',
            description: error?.message || 'Terjadi kesalahan. Silakan coba lagi.',
        })
    }
}
</script>

<template>
    <div class="stf-page">
        <!-- SAlert overlay -->
        <SAlert
            v-model:visible="alertVisible"
            :type="alertType"
            :title="alertTitle"
            :description="alertDescription"
            primary-button-text="OK"
            @primary-click="handleAlertPrimary"
        />

        <div class="form-page-container">
            <!-- Back Button -->
            <div class="mb-4">
                <button
                    @click="router.back()"
                    class="flex items-center gap-2 text-[#2e3094] font-['Be_Vietnam_Pro'] font-semibold text-[14px] hover:underline"
                >
                    <span>&larr;</span> Kembali
                </button>
            </div>

            <!-- Header -->
            <div class="form-header mb-8">
                <h1 class="text-2xl font-bold mb-2 font-display text-[var(--color-general-black)]">
                    Edit Laporan Bullying
                </h1>
                <p class="text-gray-500 font-display text-sm">
                    Perbarui informasi laporan jika diperlukan.<br>
                    Data yang akurat sangat membantu sekolah dalam menangani setiap kasus dengan adil.
                </p>
            </div>

            <div class="form-wrapper">
            <form @submit.prevent="handleSubmit" class="laporan-form" novalidate>

                <!-- Judul -->
                <div class="form-group">
                    <STextField
                        v-model="judul"
                        label="Judul Laporan"
                        :required="true"
                        :placeholder="'Ketik di sini...'"
                        :variant="'text'"
                        :disabled="false"
                        @blur="validate"
                    />
                    <span v-if="errors.judul" class="error-msg">{{ errors.judul }}</span>
                </div>

                <!-- Tanggal Kejadian -->
                <div class="form-group">
                    <div class="custom-label-row">
                        <label class="custom-label">Tanggal Kejadian</label>
                        <span class="custom-asterisk">*</span>
                    </div>
                    <div class="relative w-full">
                        <button
                            type="button"
                            class="date-picker-btn flex items-center gap-2"
                            @click="showDatePicker = !showDatePicker"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span v-if="tanggalKejadian">{{ new Date(tanggalKejadian).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                            <span v-else class="placeholder-text text-neutral-300">Pilih tanggal kejadian...</span>
                        </button>
                        <div v-show="showDatePicker" class="absolute left-0 top-[52px] z-50 shadow-2xl border rounded-2xl overflow-hidden scale-90 origin-top-left bg-white">
                            <SDatePicker v-model="tanggalKejadianObj" />
                        </div>
                    </div>
                    <span v-if="errors.tanggalKejadian" class="error-msg">{{ errors.tanggalKejadian }}</span>
                </div>

                <!-- Waktu Kejadian -->
                <div class="form-group">
                    <div class="custom-label-row">
                        <label class="custom-label">Waktu Kejadian</label>
                        <span class="optional-tag ml-1">(opsional)</span>
                    </div>
                    <div class="relative w-full">
                        <input 
                            type="time"
                            v-model="waktuKejadian"
                            class="time-input"
                        />
                    </div>
                </div>

                <!-- Lokasi -->
                <div class="form-group">
                    <STextField
                        v-model="lokasi"
                        label="Lokasi Kejadian"
                        :required="true"
                        :placeholder="'Ketik di sini...'"
                        :variant="'text'"
                        :disabled="false"
                        @blur="validate"
                    />
                    <span v-if="errors.lokasi" class="error-msg">{{ errors.lokasi }}</span>
                </div>

                <!-- Jenis Bullying -->
                <div class="form-group">
                    <div class="custom-label-row">
                        <label class="custom-label">Jenis Bullying</label>
                        <span class="custom-asterisk">*</span>
                    </div>
                    <div class="relative w-full">
                        <select 
                            v-model="jenisBullying" 
                            @change="validate"
                            class="bullying-select"
                            :class="{ 'placeholder-active': !jenisBullying }"
                        >
                            <option value="" disabled selected>Pilih jenis bullying...</option>
                            <option v-for="option in jenisBullyingOptions" :key="option.value" :value="option.value" class="text-general-black">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <span v-if="errors.jenisBullying" class="error-msg">{{ errors.jenisBullying }}</span>
                </div>

                <!-- Deskripsi -->
                <div class="form-group">
                    <STextField
                        v-model="deskripsi"
                        label="Deskripsi Kejadian"
                        :required="true"
                        :placeholder="'Ketik detail kejadian di sini...'"
                        :variant="'textarea'"
                        :disabled="false"
                        @blur="validate"
                    />
                    <span v-if="errors.deskripsi" class="error-msg">{{ errors.deskripsi }}</span>
                </div>

                <!-- Bukti Pendukung -->
                <div class="form-group">
                    <div class="custom-label-row">
                        <label class="custom-label">Bukti Pendukung <span class="optional-tag">(opsional)</span></label>
                        <span v-if="buktiPendukung.length > 0" class="file-count">{{ buktiPendukung.length }}/5 foto</span>
                    </div>
                    <div class="file-upload-section">
                        <p class="anon-hint mb-1">Upload foto baru akan mengganti foto yang sebelumnya</p>
                        <input
                            ref="buktiInputRef"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            class="file-input-hidden"
                            multiple
                            @change="handleFileChange"
                        />
                        <button 
                            type="button" 
                            class="choose-file-btn" 
                            @click="triggerFileInput"
                            :disabled="buktiPendukung.length >= 5"
                        >
                            {{ buktiPendukung.length >= 5 ? 'Maksimal 5 Foto' : 'Pilih Foto Baru' }}
                        </button>
                        <div v-if="buktiPendukung.length > 0" class="file-list">
                            <div v-for="(file, index) in buktiPendukung" :key="index" class="file-chosen-wrapper">
                                <span class="file-chosen">{{ file.name }}</span>
                                <button type="button" class="remove-file-btn" @click="removeFile(index)" title="Hapus file">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <span v-if="buktiError" class="error-msg">{{ buktiError }}</span>
                </div>
                
                <!-- Anonimitas -->
                <div class="form-group anonimitas-group">
                    <div class="anonimitas-row">
                        <div class="custom-label-row mb-0">
                            <label class="custom-label">Anonimitas</label>
                            <span class="custom-asterisk">*</span>
                        </div>
                        <SToggle v-model="anonimitas" />
                        <span class="switch-label">{{ anonimitas ? 'Ya (Laporkan secara Anonim)' : 'Tidak (Gunakan Nama Asli)' }}</span>
                    </div>
                    <p class="anon-hint" v-if="anonimitas">
                        Identitas Anda akan disembunyikan dari pihak yang dilaporkan, namun tetap dapat dilihat oleh admin/guru untuk keperluan validasi.
                    </p>
                </div>

                <!-- Action Buttons -->
                <div class="form-group">
                    <div class="action-buttons">
                        <SButton
                            label="Batal"
                            variant="ghost"
                            type="button"
                            @click="$router.push(`/laporan-bullying/${$route.params.id}`)"
                            class="btn-back"
                        />
                        <button
                            type="submit"
                            class="submit-btn"
                            :disabled="!isFormValid"
                        >
                            Simpan Perubahan
                        </button>
                    </div>
                </div>

            </form>
        </div>
    </div>
</div>
</template>

<style scoped>
/* ─── Utility ─── */
.visually-hidden-date {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    border: 0;
}

/* ─── Labels ─── */
.custom-label-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
}
.custom-label {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-general-black);
    font-family: "Be Vietnam Pro", sans-serif;
}
.custom-asterisk {
    color: var(--color-general-red);
    font-size: 16px;
    font-weight: 700;
    margin-left: 2px;
    font-family: "Be Vietnam Pro", sans-serif;
}
.optional-tag {
    font-weight: 400;
    font-size: 13px;
    color: var(--color-neutral-400, #9ca3af);
}

/* ─── Page shell ─── */
.create-laporan-page {
    min-height: 100vh;
    background: var(--color-general-frame, #f7f8fa);
    padding: 32px 16px;
}

/* ─── Card ─── */
.form-page-container {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
}

.form-wrapper {
    background: var(--color-blue-50);
    border-radius: 20px;
    box-shadow: 0 4px 24px 0 rgba(46, 48, 148, 0.1);
    padding: 48px 40px;
}

/* ─── Form layout ─── */
.laporan-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* ─── Error ─── */
.error-msg {
    color: var(--color-general-red);
    font-size: 12px;
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 600;
}

/* ─── Date picker button ─── */
.date-picker-btn {
    display: flex;
    width: 100%;
    align-items: center;
    border-radius: 8px;
    border: 1px solid var(--color-general-border);
    background: white;
    padding: 10px 16px;
    color: var(--color-general-black);
    font-size: 15px;
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 500;
    transition: border-color 0.2s, box-shadow 0.2s;
    cursor: pointer;
    text-align: left;
}
.date-picker-btn:hover,
.date-picker-btn:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.placeholder-text {
    color: #d1d5db;
}

/* ─── Time input ─── */
.time-input {
    display: flex;
    width: 100%;
    align-items: center;
    border-radius: 8px;
    border: 1px solid var(--color-general-border);
    background: white;
    padding: 10px 16px;
    color: var(--color-general-black);
    font-size: 15px;
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 500;
    transition: border-color 0.2s, box-shadow 0.2s;
    outline: none;
}
.time-input:hover,
.time-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

/* ─── Select ─── */
.bullying-select {
    display: flex;
    width: 100%;
    align-items: center;
    border-radius: 8px;
    border: 1px solid var(--color-general-border);
    background: white;
    padding: 10px 40px 10px 16px;
    color: var(--color-general-black);
    font-size: 15px;
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 500;
    transition: border-color 0.2s, box-shadow 0.2s;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1em;
}
.bullying-select:hover,
.bullying-select:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.bullying-select.placeholder-active {
    color: #d1d5db;
}

/* ─── File upload ─── */
.file-input-hidden {
    display: none;
}
.file-upload-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.file-count {
    font-size: 12px;
    color: var(--color-neutral-400);
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 500;
    margin-left: auto;
}
.choose-file-btn {
    background: var(--color-blue-500);
    color: var(--color-general-white);
    font-size: 14px;
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    padding: 8px 18px;
    cursor: pointer;
    transition: background 0.2s;
    align-self: flex-start;
}
.choose-file-btn:hover:not(:disabled) {
    background: var(--color-blue-600);
}
.choose-file-btn:disabled {
    background: var(--color-neutral-300);
    cursor: not-allowed;
    opacity: 0.6;
}
.file-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.file-chosen-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--color-blue-50);
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--color-blue-200);
}
.file-chosen {
    font-size: 13px;
    color: var(--color-blue-500);
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 500;
    flex: 1;
    word-break: break-all;
}
.remove-file-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--color-blue-400);
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;
    flex-shrink: 0;
}
.remove-file-btn:hover {
    background: var(--color-blue-100);
    color: var(--color-blue-600);
}

/* ─── Anonimitas ─── */
.anonimitas-group {
    margin-bottom: 4px;
}
.anonimitas-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}
.switch-label {
    font-size: 13px;
    color: var(--color-general-black);
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 500;
}
.anon-hint {
    font-size: 12px;
    color: var(--color-neutral-500, #6b7280);
    font-family: "Be Vietnam Pro", sans-serif;
    margin-top: 4px;
    line-height: 1.5;
}

/* ─── Action buttons ─── */
.action-buttons {
    display: flex;
    gap: 12px;
}
.btn-back {
    flex: 1;
}
.submit-btn {
    flex: 1;
    background: var(--color-blue-500);
    color: var(--color-general-white);
    font-size: 16px;
    font-weight: 700;
    font-family: "Be Vietnam Pro", sans-serif;
    border: none;
    border-radius: 10px;
    padding: 14px 0;
    cursor: pointer;
    transition: background 0.2s;
    letter-spacing: 0.01em;
    box-shadow: 0 2px 8px rgba(46,48,148,0.10);
}
.submit-btn:disabled {
    background: var(--color-blue-200);
    color: var(--color-general-white);
    cursor: not-allowed;
    box-shadow: none;
}
.submit-btn:hover:not(:disabled) {
    background: var(--color-blue-600);
}

/* ─── SAlert overlay ─── */
.salert-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(2px);
    padding: 16px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* ════════════════════════════════════════════
   RESPONSIVE BREAKPOINTS
   ════════════════════════════════════════════ */

/* ── Tablet (601px – 900px) ── */
@media (min-width: 601px) and (max-width: 900px) {
    .create-laporan-page {
        padding: 24px 16px;
    }
    .form-container {
        max-width: 92%;
        padding: 36px 28px;
        border-radius: 18px;
    }
    .form-title.stf-header {
        font-size: 20px;
        margin-bottom: 24px;
    }
    .laporan-form {
        gap: 18px;
    }
    .custom-label {
        font-size: 15px;
    }
    .custom-asterisk {
        font-size: 15px;
    }
    .date-picker-btn,
    .bullying-select,
    .time-input {
        font-size: 14px;
        padding: 10px 14px;
    }
    .submit-btn {
        font-size: 15px;
        padding: 12px 0;
    }
}

/* ── Mobile (≤ 600px) ── */
@media (max-width: 600px) {
    /* Page shell: flush edges, use safe area */
    .create-laporan-page {
        padding: 0 0 env(safe-area-inset-bottom, 24px);
        min-height: 100dvh;
        background: var(--color-blue-50);
    }

    /* Title sits above the card, flush left */
    .form-title.stf-header {
        font-size: 17px;
        margin: 20px 16px 0;
        text-align: left;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--color-blue-100, #dbeafe);
    }

    /* Card: no radius, no shadow, full-width */
    .form-container {
        max-width: 100%;
        margin: 0;
        padding: 16px 16px 40px;
        border-radius: 0;
        box-shadow: none;
    }

    .laporan-form {
        gap: 14px;
    }

    .form-group {
        gap: 4px;
    }

    /* Labels */
    .custom-label {
        font-size: 13px;
    }
    .custom-asterisk {
        font-size: 13px;
    }
    .optional-tag {
        font-size: 11px;
    }

    /* Inputs */
    .date-picker-btn,
    .bullying-select,
    .time-input {
        font-size: 13px;
        padding: 10px 12px;
        border-radius: 8px;
    }
    .bullying-select {
        padding-right: 36px;
    }

    /* Error */
    .error-msg {
        font-size: 11px;
    }

    /* File upload */
    .choose-file-btn {
        font-size: 12px;
        padding: 8px 16px;
        border-radius: 6px;
        align-self: stretch;
        text-align: center;
    }
    .file-chosen {
        font-size: 11px;
    }
    .file-chosen-wrapper {
        padding: 5px 10px;
    }
    .file-count {
        font-size: 11px;
    }

    /* Anonimitas */
    .anonimitas-row {
        gap: 8px;
    }
    .switch-label {
        font-size: 12px;
        width: 100%;
        margin-top: 2px;
    }
    .anon-hint {
        font-size: 11px;
    }

    /* Action buttons — stack vertically, submit on top */
    .action-buttons {
        flex-direction: column-reverse;
        gap: 8px;
    }
    .btn-back,
    .submit-btn {
        width: 100%;
        padding: 12px 0;
        font-size: 14px;
    }
}
</style>