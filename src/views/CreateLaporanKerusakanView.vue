<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import STextField from '@/components/STextField.vue'
import SToggle from '@/components/SToggle.vue'
import SButton from '@/components/SButton.vue'
import SAlert from '@/components/SAlert.vue'
import SDatePicker from '@/components/SDatePicker.vue'
import { useLaporanKerusakanStore } from '@/stores/laporanKerusakan'

const router = useRouter()
const laporanStore = useLaporanKerusakanStore()

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
const buktiInputRef = ref<HTMLInputElement | null>(null)
const tanggalKejadian = ref('')
const tanggalKejadianObj = ref<Date | null>(null)
const showDatePicker = ref(false)
const lokasi = ref('')
const deskripsi = ref('')
const anonimitas = ref(false)
const buktiPendukung = ref<File[]>([])
const buktiError = ref('')
const isSubmitting = ref(false)

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

const MAX_FILES = 5
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_TOTAL_SIZE_BYTES = MAX_FILES * MAX_FILE_SIZE_BYTES
const MIN_REPORT_DATE = new Date('2000-01-01')
const FORBIDDEN_SPECIAL_CHARS_REGEX = /[@!~`#$%^*+]/

const errors = ref({
    judul: '',
    tanggalKejadian: '',
    lokasi: '',
    deskripsi: '',
})

const isFormValid = computed(() => {
    const normalizedJudul = normalizeText(judul.value)
    const normalizedLokasi = normalizeText(lokasi.value)
    const normalizedDeskripsi = normalizeText(deskripsi.value)

    return (
        normalizedJudul &&
        tanggalKejadian.value &&
        normalizedLokasi &&
        normalizedDeskripsi &&
        !buktiError.value &&
        !isSubmitting.value
    )
})

function normalizeText(value: string) {
    return value
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim()
}

function validateTextField(opts: {
    label: string
    value: string
    minLength?: number
    maxLength?: number
}) {
    const normalized = normalizeText(opts.value)

    if (!normalized) return `${opts.label} wajib diisi`
    if (FORBIDDEN_SPECIAL_CHARS_REGEX.test(normalized)) {
        return `${opts.label} mengandung karakter yang tidak diperbolehkan`
    }
    if (opts.minLength && normalized.length < opts.minLength) {
        return `${opts.label} minimal ${opts.minLength} karakter`
    }
    if (opts.maxLength && normalized.length > opts.maxLength) {
        return `${opts.label} maksimal ${opts.maxLength} karakter`
    }

    return ''
}

function mapServerFieldErrors(fieldErrors: Record<string, any>) {
    const firstMessage = (value: any) => {
        if (Array.isArray(value)) return String(value[0] ?? '')
        return String(value ?? '')
    }

    if (fieldErrors.judul) errors.value.judul = firstMessage(fieldErrors.judul)
    if (fieldErrors.tanggal_kejadian) errors.value.tanggalKejadian = firstMessage(fieldErrors.tanggal_kejadian)
    if (fieldErrors.lokasi) errors.value.lokasi = firstMessage(fieldErrors.lokasi)
    if (fieldErrors.deskripsi) errors.value.deskripsi = firstMessage(fieldErrors.deskripsi)
    if (fieldErrors.foto_bukti) buktiError.value = firstMessage(fieldErrors.foto_bukti)
}

function validate() {
    errors.value.judul = validateTextField({
        label: 'Judul',
        value: judul.value,
        minLength: 5,
        maxLength: 50,
    })

    if (!tanggalKejadian.value) {
        errors.value.tanggalKejadian = 'Tanggal wajib diisi'
    } else {
        const picked = new Date(tanggalKejadian.value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        picked.setHours(0, 0, 0, 0)
        if (picked < MIN_REPORT_DATE) {
            errors.value.tanggalKejadian = 'Tanggal kejadian tidak valid'
        } else if (picked > today) {
            errors.value.tanggalKejadian = 'Tanggal tidak boleh lebih dari hari ini'
        } else {
            errors.value.tanggalKejadian = ''
        }
    }

    errors.value.lokasi = validateTextField({
        label: 'Lokasi',
        value: lokasi.value,
        minLength: 3,
        maxLength: 255,
    })

    errors.value.deskripsi = validateTextField({
        label: 'Deskripsi',
        value: deskripsi.value,
        minLength: 50,
        maxLength: 2000,
    })
}

function validateField(field: 'judul' | 'lokasi' | 'deskripsi') {
    if (field === 'judul') {
        errors.value.judul = validateTextField({
            label: 'Judul',
            value: judul.value,
            minLength: 5,
            maxLength: 50,
        })
        return
    }

    if (field === 'lokasi') {
        errors.value.lokasi = validateTextField({
            label: 'Lokasi',
            value: lokasi.value,
            minLength: 3,
            maxLength: 255,
        })
        return
    }

    errors.value.deskripsi = validateTextField({
        label: 'Deskripsi',
        value: deskripsi.value,
        minLength: 50,
        maxLength: 2000,
    })
}

function triggerFileInput() {
    buktiInputRef.value!.click();
}

function handleFileChange(e: Event) {
    const files = (e.target as HTMLInputElement).files
    buktiError.value = ''

    if (!files || files.length === 0) return

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    const newFiles: File[] = []
    const rejected: string[] = []
    const existingSignatures = new Set(
        buktiPendukung.value.map((file) => `${file.name}|${file.size}|${file.lastModified}`)
    )
    const remainingSlots = MAX_FILES - buktiPendukung.value.length
    let totalSize = buktiPendukung.value.reduce((sum, file) => sum + file.size, 0)

    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file) continue

        if (newFiles.length >= remainingSlots) {
            rejected.push(`${file.name}: melewati batas maksimal ${MAX_FILES} foto`)
            continue
        }

        const signature = `${file.name}|${file.size}|${file.lastModified}`
        if (existingSignatures.has(signature)) {
            rejected.push(`${file.name}: file duplikat`)
            continue
        }

        if (file.size === 0) {
            rejected.push(`${file.name}: file kosong`)
            continue
        }

        if (!allowed.includes(file.type)) {
            rejected.push(`${file.name}: format tidak didukung`)
            continue
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            rejected.push(`${file.name}: ukuran maksimal 5 MB`)
            continue
        }

        if (totalSize + file.size > MAX_TOTAL_SIZE_BYTES) {
            rejected.push(`${file.name}: total ukuran semua foto maksimal 25 MB`)
            continue
        }

        newFiles.push(file)
        totalSize += file.size
        existingSignatures.add(signature)
    }

    buktiPendukung.value = [...buktiPendukung.value, ...newFiles]
    buktiError.value = rejected.length > 0 ? rejected.join(' | ') : ''
    if (buktiInputRef.value) buktiInputRef.value.value = ''
}

function removeFile(index: number) {
    buktiPendukung.value.splice(index, 1)
    buktiError.value = ''
}

async function handleSubmit() {
    if (isSubmitting.value) return

    validate()
    if (!isFormValid.value) return

    isSubmitting.value = true

    try {
        const result = await laporanStore.createLaporanKerusakan({
            judul: normalizeText(judul.value),
            tanggal_kejadian: tanggalKejadian.value,
            lokasi: normalizeText(lokasi.value),
            deskripsi: normalizeText(deskripsi.value),
            anonimitas: anonimitas.value,
            foto_bukti: buktiPendukung.value.length > 0 ? buktiPendukung.value : undefined,
        })

        judul.value = ''
        tanggalKejadian.value = ''
        lokasi.value = ''
        deskripsi.value = ''
        anonimitas.value = false
        buktiPendukung.value = []
        buktiError.value = ''
        Object.keys(errors.value).forEach(k => (errors.value[k as keyof typeof errors.value] = ''))

        showAlert({
            type: 'default',
            title: 'Laporan Terkirim',
            description: 'Laporan berhasil dibuat',
            onPrimary: () => {
                if (result && result.id) {
                    router.replace(`/laporan-kerusakan/${result.id}`)
                } else {
                    router.replace('/laporan-kerusakan')
                }
            }
        })

    } catch (error: any) {
        showAlert({
            type: 'warning',
            title: 'Gagal Membuat Laporan',
            description: error?.message || 'Terjadi kesalahan. Silakan coba lagi.',
        })
        if (error?.fieldErrors && typeof error.fieldErrors === 'object') {
            mapServerFieldErrors(error.fieldErrors)
        }
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="stf-page">
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
                <button @click="router.back()"
                    class="flex items-center gap-2 text-[#2e3094] font-['Be_Vietnam_Pro'] font-semibold text-[14px] hover:underline">
                    <span>&larr;</span> Kembali
                </button>
            </div>

            <!-- Header -->
            <div class="form-header mb-8">
                <h1 class="text-2xl font-bold mb-2 font-display text-[var(--color-general-black)]">
                    Tambah Laporan Kerusakan
                </h1>
                <p class="text-gray-500 font-display text-sm">
                    Laporkan kerusakan fasilitas sekolah agar segera ditindaklanjuti.<br>
                    Deskripsi yang jelas membantu tim sarana prasarana melakukan perbaikan lebih cepat.
                </p>
            </div>

            <div class="form-wrapper">
                <form @submit.prevent="handleSubmit" class="laporan-form" novalidate>
                    <div class="form-group">
                        <STextField v-model="judul" label="Judul" :required="true" :placeholder="'Ketik di sini...'"
                            :variant="'text'" :disabled="false" @blur="validateField('judul')" />
                        <span v-if="errors.judul" class="error-msg">{{ errors.judul }}</span>
                    </div>

                    <div class="form-group">
                        <div class="custom-label-row">
                            <label class="custom-label">Tanggal Kejadian</label>
                            <span class="custom-asterisk">*</span>
                        </div>
                        <div class="relative w-full">
                            <button type="button"
                                class="flex w-full items-center gap-2 rounded-lg border border-general-border bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-general-black text-sm sm:text-base font-['Be_Vietnam_Pro'] font-medium placeholder:text-neutral-300 transition-colors hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                                @click="showDatePicker = !showDatePicker">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="text-neutral-400">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span v-if="tanggalKejadian">{{ new Date(tanggalKejadian).toLocaleDateString('id-ID', {
                                    year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                                <span v-else class="text-neutral-300">Pilih tanggal...</span>
                            </button>
                            <div v-show="showDatePicker"
                                class="absolute left-0 top-[52px] z-50 shadow-2xl border rounded-2xl overflow-hidden scale-90 origin-top-left bg-white">
                                <SDatePicker @close="showDatePicker = false" v-model="tanggalKejadianObj" />
                            </div>
                        </div>
                        <span v-if="errors.tanggalKejadian" class="error-msg">{{ errors.tanggalKejadian }}</span>
                    </div>

                    <div class="form-group">
                        <STextField v-model="lokasi" label="Lokasi Kejadian" :required="true"
                            :placeholder="'Ketik di sini...'" :variant="'text'" :disabled="false"
                            @blur="validateField('lokasi')" />
                        <span v-if="errors.lokasi" class="error-msg">{{ errors.lokasi }}</span>
                    </div>

                    <div class="form-group">
                        <div class="custom-label-row flex justify-between w-full">
                            <div>
                                <label class="custom-label">Deskripsi Kerusakan</label>
                                <span class="custom-asterisk">*</span>
                            </div>
                            <span class="file-count">{{ deskripsi.length }}/50 karakter</span>
                        </div>
                        <STextField v-model="deskripsi" label=""
                            :placeholder="'Ketik detail kerusakan di sini...'" :variant="'textarea'" :disabled="false"
                            @blur="validateField('deskripsi')" />
                        <span v-if="errors.deskripsi" class="error-msg">{{ errors.deskripsi }}</span>
                    </div>

                    <div class="form-group">
                        <div class="custom-label-row">
                            <label class="custom-label">Bukti Pendukung (opsional)</label>
                            <span v-if="buktiPendukung.length > 0" class="file-count">{{ buktiPendukung.length }}/{{
                                MAX_FILES }} foto</span>
                        </div>
                        <p class="file-guidance">Format: JPG/JPEG/PNG/WEBP · Maks. 25MB/5 foto</p>
                        <div class="file-upload-section">
                            <input ref="buktiInputRef" type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                                class="file-input-hidden" multiple @change="handleFileChange" />
                            <button type="button" class="choose-file-btn" @click="triggerFileInput"
                                :disabled="buktiPendukung.length >= MAX_FILES">
                                {{ buktiPendukung.length >= MAX_FILES ? 'Maksimal 5 Foto' : 'Tambah Foto' }}
                            </button>
                            <div v-if="buktiPendukung.length > 0" class="file-list">
                                <div v-for="(file, index) in buktiPendukung" :key="index" class="file-chosen-wrapper">
                                    <span class="file-chosen">{{ file.name }}</span>
                                    <button type="button" class="remove-file-btn" @click="removeFile(index)"
                                        title="Hapus file">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <span v-if="buktiError" class="error-msg">{{ buktiError }}</span>
                    </div>

                    <div class="form-group">
                        <div class="flex items-center gap-3">
                            <div class="custom-label-row mb-0">
                                <label class="custom-label">Anonimitas</label>
                                <span class="custom-asterisk">*</span>
                            </div>
                            <SToggle v-model="anonimitas" />
                            <span class="switch-label">{{ anonimitas ? 'Ya (Anonim)' : 'Tidak (Nama Asli)' }}</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <div style="display: flex; gap: 12px;">
                            <SButton label="Kembali" variant="ghost" type="button" @click="$router.back()"
                                class="w-full" />
                            <button type="submit" class="submit-btn w-full" :disabled="!isFormValid">
                                {{ isSubmitting ? 'Mengirim...' : 'Kirim Laporan' }}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
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
    clip: rect(0, 0, 0, 0);
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

.stf-label--bold {
    font-weight: 700;
    font-size: 16px;
    color: var(--color-general-black);
    font-family: "Be Vietnam Pro", sans-serif;
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

.file-guidance {
    font-size: 12px;
    color: var(--color-neutral-400);
    font-family: "Be Vietnam Pro", sans-serif;
    margin: 0;
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

.error-msg {
    color: var(--color-general-red);
    font-size: 12px;
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 600;
}

.form-group--switch {
    flex-direction: row;
    align-items: center;
    gap: 12px;
}

.switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #e5e7eb;
    border-radius: 24px;
    transition: .2s;
}

.switch input:checked+.slider {
    background-color: var(--color-blue-500, #3b82f6);
}

.slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
    transition: .2s;
}

.switch input:checked+.slider:before {
    transform: translateX(20px);
}

.switch-label {
    font-size: 13px;
    color: var(--color-blue-500);
    font-family: "Be Vietnam Pro", sans-serif;
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
    box-shadow: 0 2px 8px rgba(46, 48, 148, 0.10);
}

.submit-btn:disabled {
    background: var(--color-blue-100);
    color: var(--color-general-white);
    cursor: not-allowed;
}

@media (max-width: 600px) {
    .stf-page {
        padding: 16px 8px;
    }

    .form-wrapper {
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

    .submit-btn,
    .submit-btn:disabled {
        font-size: 14px;
        padding: 10px 0;
        border-radius: 8px;
    }

    .choose-file-btn {
        font-size: 12px;
        padding: 6px 12px;
        border-radius: 6px;
    }

    .file-chosen {
        font-size: 11px;
    }

    .switch-label {
        font-size: 11px;
    }

    .custom-label,
    .custom-asterisk {
        font-size: 14px;
    }

    .error-msg {
        font-size: 11px;
    }

    .form-group>div[style*="display: flex"] {
        flex-direction: column-reverse !important;
        gap: 8px !important;
    }

    .form-group>div[style*="display: flex"]>* {
        width: 100% !important;
        min-width: 0 !important;
        flex: none !important;
    }
}

</style>