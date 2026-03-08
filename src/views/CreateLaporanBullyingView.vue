<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import STextField from '@/components/STextField.vue'
import SToggle from '@/components/SToggle.vue'
import SButton from '@/components/SButton.vue'
import SAlert from '@/components/SAlert.vue'
import { useLaporanBullyingStore } from '@/stores/laporanBullying'

const router = useRouter()
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
const tanggalInputRef = ref<HTMLInputElement | null>(null)
const lokasi = ref('')
const jenisBullying = ref('')
const deskripsi = ref('')
const anonimitas = ref(false)
const buktiPendukung = ref<File[]>([])
const buktiError = ref('')
const buktiInputRef = ref<HTMLInputElement | null>(null)

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
    
    // Check if adding new files would exceed max limit
    if (buktiPendukung.value.length + files.length > 5) {
        buktiError.value = 'Maksimal 5 foto'
        if (buktiInputRef.value) buktiInputRef.value.value = ''
        return
    }
    
    // Validate each file
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

    try {
        await laporanStore.buatLaporan({
            judul: judul.value.trim(),
            deskripsi: deskripsi.value.trim(),
            lokasi: lokasi.value.trim(),
            tanggal_kejadian: tanggalKejadian.value,
            jenis_bullying: jenisBullying.value,
            anonimitas: anonimitas.value,
            foto_bukti: buktiPendukung.value.length > 0 ? buktiPendukung.value : undefined,
        })
        
        // Reset form
        judul.value = ''
        deskripsi.value = ''
        lokasi.value = ''
        tanggalKejadian.value = ''
        jenisBullying.value = ''
        anonimitas.value = false
        buktiPendukung.value = []
        buktiError.value = ''
        Object.keys(errors.value).forEach(k => (errors.value[k as keyof typeof errors.value] = ''))
        
        // Redirect setelah berhasil
        router.push('/laporan-bullying')
    } catch (error: any) {
        showAlert({
            type: 'warning',
            title: 'Gagal Membuat Laporan',
            description: error?.message || 'Terjadi kesalahan. Silakan coba lagi.',
        })
    }
}
</script>

<template>
    <div class="create-laporan-page">
        <!-- SAlert overlay -->
        <Teleport to="body">
            <Transition name="fade">
                <div v-if="alertVisible" class="salert-overlay" @click.self="alertVisible = false">
                    <SAlert
                        :type="alertType"
                        :title="alertTitle"
                        :description="alertDescription"
                        primary-button-text="OK"
                        @close="alertVisible = false"
                        @primary-click="handleAlertPrimary"
                    />
                </div>
            </Transition>
        </Teleport>
        <h4 class="form-title stf-header">Tambah Laporan Bullying</h4>
        <div class="form-container">
            <form @submit.prevent="handleSubmit" class="laporan-form" novalidate>
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
                <div class="form-group">
                    <div class="custom-label-row">
                        <label class="custom-label">Tanggal Kejadian</label>
                        <span class="custom-asterisk">*</span>
                    </div>
                    <div class="relative w-full">
                        <input
                            ref="tanggalInputRef"
                            type="date"
                            v-model="tanggalKejadian"
                            class="visually-hidden-date"
                            @change="validate"
                            required
                            tabindex="-1"
                        />
                        <button
                            type="button"
                            class="flex w-full items-center rounded-lg border border-general-border bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-general-black text-sm sm:text-base font-['Be_Vietnam_Pro'] font-medium placeholder:text-neutral-300 transition-colors hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                            @click="() => { if (tanggalInputRef?.showPicker) tanggalInputRef.showPicker(); else tanggalInputRef?.click(); }"
                        >
                            <span v-if="tanggalKejadian">{{ new Date(tanggalKejadian).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                            <span v-else class="text-neutral-300">Pilih tanggal...</span>
                        </button>
                    </div>
                    <span v-if="errors.tanggalKejadian" class="error-msg">{{ errors.tanggalKejadian }}</span>
                </div>
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
                <div class="form-group">
                    <div class="custom-label-row">
                        <label class="custom-label">Jenis Bullying</label>
                        <span class="custom-asterisk">*</span>
                    </div>
                    <div class="relative w-full">
                        <select 
                            v-model="jenisBullying" 
                            @change="validate"
                            class="flex w-full items-center rounded-lg border border-general-border bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-general-black text-sm sm:text-base font-['Be_Vietnam_Pro'] font-medium transition-colors hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                            :class="{ 'text-neutral-300': !jenisBullying }"
                        >
                            <option value="" disabled selected>Pilih jenis bullying...</option>
                            <option v-for="option in jenisBullyingOptions" :key="option.value" :value="option.value" class="text-general-black">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    <span v-if="errors.jenisBullying" class="error-msg">{{ errors.jenisBullying }}</span>
                </div>
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

                <div class="form-group">
                    <div class="custom-label-row">
                        <label class="custom-label">Bukti Pendukung (opsional)</label>
                        <span v-if="buktiPendukung.length > 0" class="file-count">{{ buktiPendukung.length }}/5 foto</span>
                    </div>
                    <div class="file-upload-section">
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
                            {{ buktiPendukung.length >= 5 ? 'Maksimal 5 Foto' : 'Tambah Foto' }}
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
                <div class="form-group mb-4">
                    <div class="flex items-center gap-3">
                        <div class="custom-label-row mb-0">
                            <label class="custom-label">Anonimitas</label>
                            <span class="custom-asterisk">*</span>
                        </div>
                        <SToggle v-model="anonimitas" />
                        <span class="switch-label">{{ anonimitas ? 'Ya (Laporkan secara Anonim)' : 'Tidak (Gunakan Nama Asli)' }}</span>
                    </div>
                    <p class="text-xs text-neutral-500 mt-1 font-['Be_Vietnam_Pro']" v-if="anonimitas">
                        Identitas Anda akan disembunyikan dari pihak yang dilaporkan, namun tetap dapat dilihat oleh admin/guru untuk keperluan validasi.
                    </p>
                </div>

                <div class="form-group">
                    <div style="display: flex; gap: 12px;">
                        <SButton
                            label="Kembali"
                            variant="ghost"
                            type="button"
                            @click="$router.back()"
                            class="w-full"
                        />
                        <button
                            type="submit"
                            class="submit-btn w-full"
                            :disabled="!isFormValid"
                        >
                            Kirim Laporan
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
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
.create-laporan-page {
    min-height: 100vh;
    background: var(--color-general-frame, #f7f8fa);
    padding: 32px 0;
}
.form-container {
    max-width: 700px;
    margin: 0 auto;
    background: var(--color-blue-50);
    border-radius: 20px;
    box-shadow: 0 4px 24px 0 rgba(46, 48, 148, 0.10);
    padding: 48px 40px;
}

.form-title.stf-header {
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 700;
    font-size: 22px;
    margin-bottom: 32px;
    color: var(--color-blue-500);
    text-align: center;
    letter-spacing: 0.01em;
}

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

.error-msg {
    color: var(--color-general-red);
    font-size: 12px;
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 600;
}

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

select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1em;
}

.switch-label {
    font-size: 13px;
    color: var(--color-general-black);
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 500;
}

.submit-btn {
    width: 100%;
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

@media (max-width: 600px) {
    .create-laporan-page {
        padding: 16px 8px;
    }
    .form-container {
        padding: 20px 16px;
        border-radius: 16px;
    }
    .form-title {
        font-size: 18px;
        margin-bottom: 20px;
    }
    .laporan-form {
        gap: 12px;
    }
    .form-group {
        gap: 4px;
    }
    .submit-btn, .submit-btn:disabled {
        font-size: 14px;
        padding: 10px 0;
        border-radius: 8px;
    }
    .switch-label {
        font-size: 12px;
    }
    .custom-label, .custom-asterisk {
        font-size: 14px;
    }
    .error-msg {
        font-size: 11px;
    }
    .choose-file-btn {
        font-size: 12px;
        padding: 6px 12px;
        border-radius: 6px;
    }
    .file-chosen {
        font-size: 11px;
    }
    /* Stack buttons vertically: Submit on top, Kembali below */
    .form-group > div[style*="display: flex"] {
        flex-direction: column-reverse !important;
        gap: 8px !important;
    }
    .form-group > div[style*="display: flex"] > * {
        width: 100% !important;
        min-width: 0 !important;
        flex: none !important;
    }
}

/* SAlert overlay */
.salert-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(2px);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
