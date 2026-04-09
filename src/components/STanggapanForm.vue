<script setup lang="ts">
import { ref, computed } from 'vue'
import SButton from '@/components/SButton.vue'
import { useTanggapanStore } from '@/stores/tanggapan'
import { useAlertStore } from '@/stores/alert'

/**
 * Component for submitting a new response/message to a damage report.
 * 
 * Provides a form with validation and optimistic update behavior.
 */

interface Props {
    laporanId: string
    laporanStatus: string
    laporanType?: string
}

const props = defineProps<Props>()

const tanggapanStore = useTanggapanStore()
const alertStore = useAlertStore()

const pesan = ref('')
const isSending = ref(false)
const MIN_LENGTH = 5
const MAX_LENGTH = 2000

const charCount = computed(() => pesan.value.length)
const isValid = computed(() => pesan.value.trim().length >= MIN_LENGTH)
const isClosed = computed(() => props.laporanStatus === 'selesai')

/**
 * Submit the response message.
 */
async function handleSubmit() {
    if (!isValid.value || isSending.value) return

    const trimmedPesan = pesan.value.trim()
    if (trimmedPesan.length < MIN_LENGTH) {
        alertStore.error(`Pesan minimal ${MIN_LENGTH} karakter`)
        return
    }

    isSending.value = true
    try {
        await tanggapanStore.kirimTanggapan(props.laporanId, trimmedPesan, props.laporanType || 'kerusakan')
        pesan.value = ''
    } catch (error: any) {
        const errMsg = error?.message || 'Gagal mengirim tanggapan'
        
        if (errMsg.includes('ditutup')) {
            alertStore.error('Laporan telah ditutup dan tidak dapat menerima tanggapan')
        } else if (errMsg.includes('Akses ditolak') || errMsg.includes('403')) {
            alertStore.error('Anda tidak memiliki akses')
        } else {
            alertStore.error(errMsg)
        }
    } finally {
        isSending.value = false
    }
}
</script>

<template>
    <div class="tanggapan-form">
        <div class="form-header">
            <label class="form-label">Kirim Tanggapan</label>
            <span class="char-count" :class="{ 'char-count--warning': charCount > MAX_LENGTH * 0.9 }">
                {{ charCount }} / {{ MAX_LENGTH }}
            </span>
        </div>

        <!-- Disabled state message -->
        <div v-if="isClosed" class="form-disabled-notice">
            <p>Laporan telah ditutup. Tidak dapat menambahkan tanggapan baru.</p>
        </div>

        <!-- Form (active) -->
        <div v-else class="form-container">
            <textarea
                v-model="pesan"
                class="form-textarea"
                :placeholder="'Tuliskan tanggapan Anda di sini...'"
                :disabled="isSending"
                :maxlength="MAX_LENGTH"
            />

            <div v-if="charCount > 0 && charCount < MIN_LENGTH" class="form-hint">
                Minimum {{ MIN_LENGTH }} karakter ({{ MIN_LENGTH - charCount }} lagi)
            </div>

            <SButton
                label="Kirim"
                variant="primary"
                :disabled="!isValid || isSending || isClosed"
                @click="handleSubmit"
                class="submit-btn"
            />
        </div>
    </div>
</template>

<style scoped>
.tanggapan-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.form-label {
    font-weight: 600;
    font-size: 13px;
    color: var(--color-general-black);
    margin: 0;
}

.char-count {
    font-size: 11px;
    color: #9ca3af;
    font-weight: 500;
}

.char-count--warning {
    color: #f59e0b;
}

.form-disabled-notice {
    padding: 12px;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 6px;
    text-align: center;
}

.form-disabled-notice p {
    font-size: 12px;
    color: #92400e;
    margin: 0;
}

.form-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px 12px;
    font-size: 13px;
    font-family: "Be Vietnam Pro", sans-serif;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    resize: vertical;
    transition: border-color 0.2s, box-shadow 0.2s;
    color: var(--color-general-black);
}

.form-textarea:focus {
    outline: none;
    border-color: var(--color-blue-500);
    box-shadow: 0 0 0 3px rgba(46, 48, 148, 0.08);
}

.form-textarea:disabled {
    background: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
}

.form-hint {
    font-size: 11px;
    color: #9ca3af;
}

.submit-btn {
    align-self: flex-start;
}

/* Responsive */
@media (max-width: 600px) {
    .tanggapan-form {
        padding: 12px;
    }

    .form-textarea {
        min-height: 70px;
        font-size: 12px;
    }
}
</style>
