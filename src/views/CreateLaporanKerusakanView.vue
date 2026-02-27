
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import STextField from '@/components/STextField.vue'
import SToggle from '@/components/SToggle.vue'
// SDatePicker import removed, not used

const judul = ref('')
const buktiInputRef = ref<HTMLInputElement | null>(null)
const tanggalKejadian = ref('')
const tanggalInputRef = ref<HTMLInputElement | null>(null)
const lokasi = ref('')
const deskripsi = ref('')
const anonimitas = ref(false)
const buktiPendukung = ref<File | null>(null)
const buktiError = ref('')

const errors = ref({
    judul: '',
    tanggalKejadian: '',
    lokasi: '',
    deskripsi: '',
})

const isFormValid = computed(() => {
    return (
        judul.value.trim() &&
        tanggalKejadian.value &&
        lokasi.value.trim() &&
        deskripsi.value.trim() &&
        !buktiError.value
    )
})

function validate() {
    errors.value.judul = !judul.value.trim() ? 'Judul wajib diisi' : ''
    errors.value.tanggalKejadian = !tanggalKejadian.value ? 'Tanggal wajib diisi' : ''
    errors.value.lokasi = !lokasi.value.trim() ? 'Lokasi wajib diisi' : ''
    errors.value.deskripsi = !deskripsi.value.trim() ? 'Deskripsi wajib diisi' : ''
}

function triggerFileInput() {
    // Non-null assertion because the button is only clickable if the ref is mounted
    buktiInputRef.value!.click();
}

function handleFileChange(e: Event) {
    const files = (e.target as HTMLInputElement).files
    buktiError.value = ''
    if (files && files.length > 0) {
        const file = files[0]
        if (!file) {
            buktiPendukung.value = null
            return
        }
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        if (!allowed.includes(file.type)) {
            buktiError.value = 'Format gambar tidak didukung'
            buktiPendukung.value = null
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            buktiError.value = 'Ukuran maksimal 5 MB'
            buktiPendukung.value = null
            return
        }
        buktiPendukung.value = file
    } else {
        buktiPendukung.value = null
    }
}

function generateNoLaporan() {
    // Simulasi: LK-YYYY-XXX (XXX = random 3 digit)
    const year = new Date().getFullYear()
    const rand = Math.floor(1 + Math.random() * 999)
    return `LK-${year}-${String(rand).padStart(3, '0')}`
}

function handleSubmit() {
    validate()
    if (!isFormValid.value) return

    const payload = {
        id: uuidv4(),
        no_laporan: generateNoLaporan(),
        judul_laporan: judul.value.trim(),
        tanggal_kejadian: tanggalKejadian.value,
        lokasi: lokasi.value.trim(),
        deskripsi: deskripsi.value.trim(),
        anonimitas: anonimitas.value,
        status: 'menunggu',
        tanggal_laporan: new Date().toISOString(),
        bukti_pendukung: buktiPendukung.value ? [buktiPendukung.value] : [],
    }
    // Dummy submit
    // eslint-disable-next-line no-console
    console.log('Payload:', payload)
    alert('Laporan berhasil disiapkan! (lihat console)')
    // Reset form (opsional)
    judul.value = ''
    tanggalKejadian.value = ''
    lokasi.value = ''
    deskripsi.value = ''
    anonimitas.value = false
    buktiPendukung.value = null
    buktiError.value = ''
    Object.keys(errors.value).forEach(k => (errors.value[k as keyof typeof errors.value] = ''))
}
</script>

<template>
    <div class="create-laporan-page">
        <h4 class="form-title stf-header">Tambah Laporan Kerusakan</h4>
        <div class="form-container">
            <form @submit.prevent="handleSubmit" class="laporan-form" novalidate>
                <!-- Judul -->
                <div class="form-group">
                    <STextField
                        v-model="judul"
                        label="Judul"
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
                <!-- Lokasi Kejadian -->
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
                <!-- Deskripsi Kejadian -->
                <div class="form-group">
                    <STextField
                        v-model="deskripsi"
                        label="Deskripsi Kejadian"
                        :required="true"
                        :placeholder="'Ketik di sini...'"
                        :variant="'textarea'"
                        :disabled="false"
                        @blur="validate"
                    />
                    <span v-if="errors.deskripsi" class="error-msg">{{ errors.deskripsi }}</span>
                </div>
                <!-- Bukti Pendukung -->
                <div class="form-group">
                    <div class="custom-label-row">
                        <label class="custom-label">Bukti Pendukung (opsional)</label>
                    </div>
                    <div class="file-upload-wrapper">
                        <input
                            ref="buktiInputRef"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            class="file-input-hidden"
                            @change="handleFileChange"
                        />
                        <button type="button" class="choose-file-btn" @click="triggerFileInput">
                            Pilih File
                        </button>
                        <span v-if="buktiPendukung" class="file-chosen">{{ buktiPendukung.name }}</span>
                    </div>
                    <span v-if="buktiError" class="error-msg">{{ buktiError }}</span>
                </div>
                <!-- Anonimitas -->
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

                <!-- Submit Button -->
                <div class="form-group">
                    <button
                        type="submit"
                        class="submit-btn"
                        :disabled="!isFormValid"
                    >
                        Kirim Laporan
                    </button>
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

/* Make sure native date picker is visible and not overridden by custom font */
.input-date-native[type='date'] {
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    background: inherit;
    border: none;
    outline: none;
    width: 100%;
    padding: 0;
    -webkit-appearance: auto;
    -moz-appearance: auto;
    appearance: auto;
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
    margin-right: 10px;
    transition: background 0.2s;
}
.choose-file-btn:hover {
    background: var(--color-blue-600);
}
.file-chosen {
    font-size: 13px;
    color: var(--color-blue-500);
    font-family: "Be Vietnam Pro", sans-serif;
    font-weight: 500;
}
.file-upload-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}
.error-msg {
    color: var(--color-blue-200);
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
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #e5e7eb;
    border-radius: 24px;
    transition: .2s;
}
.switch input:checked + .slider {
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
.switch input:checked + .slider:before {
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
    box-shadow: 0 2px 8px rgba(46,48,148,0.10);
}
.submit-btn:disabled {
    background: var(--color-blue-100);
    color: var(--color-general-white);
    cursor: not-allowed;
}
@media (max-width: 600px) {
    .form-container {
        padding: 14px 4px;
    }
    .form-title {
        font-size: 18px;
    }
}
</style>