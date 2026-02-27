<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SButton from '@/components/SButton.vue'
import STextField from '@/components/STextField.vue'
import { toast } from 'vue-sonner'
import { apiAuthPost } from '@/services/api'

// State
const noLaporan = ref('')
const pelapor = ref('')
const kelas = ref('')
const lokasi = ref('')
const deskripsi = ref('')
const loading = ref(false)

const router = useRouter()

// Handlers
async function handleSubmit() {
    if (!noLaporan.value || !pelapor.value || !kelas.value || !lokasi.value || !deskripsi.value) {
        toast.error('Harap isi semua field wajib.')
        return
    }

    loading.value = true
    try {
        await apiAuthPost('laporan-kerusakan/create', {
            no_laporan: noLaporan.value,
            pelapor: pelapor.value,
            kelas: kelas.value,
            lokasi: lokasi.value,
            deskripsi: deskripsi.value,
        })
        toast.success('Laporan kerusakan berhasil dibuat.')
        router.push('/laporan-kerusakan')
    } catch (error: any) {
        toast.error(error.message || 'Gagal membuat laporan kerusakan.')
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="create-laporan-page">
        <h1 class="title">Buat Laporan Kerusakan</h1>

        <form @submit.prevent="handleSubmit" class="form">
            <STextField v-model="noLaporan" label="No. Laporan" placeholder="Masukkan nomor laporan" required />
            <STextField v-model="pelapor" label="Pelapor" placeholder="Masukkan nama pelapor" required />
            <STextField v-model="kelas" label="Kelas" placeholder="Masukkan kelas" required />
            <STextField v-model="lokasi" label="Lokasi" placeholder="Masukkan lokasi kerusakan" required />
            <STextField v-model="deskripsi" label="Deskripsi" placeholder="Masukkan deskripsi kerusakan" required
                textarea />

            <div class="actions">
                <SButton label="Batal" variant="secondary" @click="() => router.push('/laporan-kerusakan')" />
                <SButton :label="loading ? 'Menyimpan...' : 'Simpan'" :disabled="loading" variant="primary"
                    type="submit" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.create-laporan-page {
    max-width: 600px;
    margin: 0 auto;
    padding: 24px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 16px;
}

.form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>