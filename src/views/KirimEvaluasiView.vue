<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SAlert from '@/components/SAlert.vue'
import { useEvaluasiGuruStore } from '@/stores/evaluasiGuru'

const router = useRouter()
const evaluasiStore = useEvaluasiGuruStore()

// --- State Variables ---
const form = ref({
    staff_id: '',
    komentar: ''
})

const ratings = ref<Record<number, number>>({})

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

const availableGurus = computed(() => {
    return evaluasiStore.daftarGuru
})

// Grup indikator berdasarkan kategori
const groupedIndikators = computed(() => {
    const groups: Record<string, any[]> = {}
    evaluasiStore.daftarIndikator.forEach(ind => {
        const cat = ind.kategori_nama || 'Aspek Penilaian'
        if (!groups[cat]) groups[cat] = []
        groups[cat].push(ind)
    })
    return groups
})

// --- Validation ---
const errors = ref({
    staff_id: '',
    komentar: '',
    ratings: ''
})

function setRating(indikatorId: number, value: number) {
    ratings.value[indikatorId] = value
    validate()
}

function validate() {
    errors.value.staff_id = !form.value.staff_id ? 'Silakan pilih nama guru.' : ''
    
    // Check if every indicator has a rating 1-5
    const missingRatings = evaluasiStore.daftarIndikator.some((ind: any) => {
        const id = Number(ind.id)
        const rating = ratings.value[id]
        return !rating || rating < 1 || rating > 5
    })
    errors.value.ratings = missingRatings ? 'Semua indikator penilaian harus diisi.' : ''
    
    if (form.value.komentar && form.value.komentar.length > 0 && form.value.komentar.trim().length < 20) {
        errors.value.komentar = 'Kritik dan Saran minimal 20 karakter jika diisi.'
    } else {
        errors.value.komentar = ''
    }
}

const isFormValid = computed(() => {
    return !errors.value.staff_id && !errors.value.ratings && !errors.value.komentar && form.value.staff_id !== ''
})

// --- Submission ---
async function handleSubmit() {
    validate()
    if (!isFormValid.value) {
        // Scroll to top if validation fails to show errors
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
    }

    const ratingArray = Object.keys(ratings.value).map(key => ({
        indikator_id: parseInt(key),
        nilai: ratings.value[parseInt(key)] as number
    }))

    try {
        await evaluasiStore.submitEvaluasi({
            staff_id: form.value.staff_id,
            rating: ratingArray,
            komentar: form.value.komentar.trim() || undefined
        })
        
        form.value.staff_id = ''
        form.value.komentar = ''
        ratings.value = {}
        
        showAlert({
            type: 'default',
            title: 'Berhasil!',
            description: 'Evaluasi kinerja guru berhasil dikirimkan.',
            onPrimary: () => {
                router.replace('/')
            }
        })
    } catch (error: any) {
        showAlert({
            type: 'warning',
            title: 'Gagal Mengirim',
            description: error?.message || 'Terjadi kesalahan saat mengirim evaluasi. Pastikan Anda belum pernah mengevaluasi guru ini di semester yang sama.',
        })
    }
}

// Fetch on mounted
onMounted(() => {
    evaluasiStore.fetchDaftarGuru(true)
    evaluasiStore.fetchDaftarIndikator()
})

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

        <div class="form-container">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <h1 class="text-[#2A2C87] text-[28px] font-bold font-['Be_Vietnam_Pro'] tracking-tight">Form Evaluasi Guru</h1>
                
                <div class="w-full md:w-[320px] flex flex-col gap-1.5">
                    <label class="text-[#4B5563] text-sm font-semibold font-['Be_Vietnam_Pro']">Nama Guru</label>
                    <select 
                        v-model="form.staff_id" 
                        @change="validate"
                        class="form-select bg-white border border-[#E5E7EB] text-[#1F2937] text-sm rounded-lg focus:ring-[#2A2C87] focus:border-[#2A2C87] block w-full p-2.5 font-['Be_Vietnam_Pro'] cursor-pointer outline-none"
                    >
                        <option value="" disabled selected>Pilih staf pendidik...</option>
                        <option v-for="guru in availableGurus" :key="guru.id" :value="guru.id">
                            {{ guru.nama_lengkap || guru.nama || 'Guru Tidak Diketahui' }}
                        </option>
                    </select>
                    <span v-if="errors.staff_id" class="text-red-500 text-xs font-semibold">{{ errors.staff_id }}</span>
                </div>
            </div>

            <!-- Form Body -->
            <form @submit.prevent="handleSubmit" novalidate>

                <!-- Menampilkan Error Global Form -->
                <div v-if="errors.ratings" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p class="text-red-600 text-sm font-semibold">Harap lengkapi semua indikator penilaian sebelum mengirim form.</p>
                </div>

                <!-- Loop Kategori Indikator -->
                <div v-for="(indicators, category) in groupedIndikators" :key="category" class="mb-10">
                    <h2 class="text-[#1F2937] text-xl font-bold font-['Be_Vietnam_Pro'] mb-4 tracking-tight">{{ category }}</h2>
                    
                    <div class="rounded-xl overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                        <!-- Table Header -->
                        <div class="flex justify-between items-center py-3 bg-[#FCFCFD] border-b border-[#F3F4F6] px-4 md:px-6">
                            <span class="text-[#6B7280] text-sm font-bold font-['Be_Vietnam_Pro'] flex-1">Aspek Penilaian</span>
                            <span class="text-[#6B7280] text-sm font-bold font-['Be_Vietnam_Pro'] w-[240px] hidden md:block">Skala Penilaian</span>
                        </div>
                        
                        <!-- Table Rows -->
                        <div v-for="(ind, index) in indicators" :key="ind.id" 
                            class="flex flex-col md:flex-row justify-between items-start md:items-center py-4 px-4 md:px-6 gap-4 md:gap-0"
                            :class="index % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-[#F3F4F6]'"
                        >
                            <!-- Deskripsi -->
                            <span class="text-[#374151] text-[15px] font-['Be_Vietnam_Pro'] flex-1 pr-6 leading-relaxed">{{ ind.deskripsi }}</span>
                            
                            <!-- Skala Mobile Header -->
                            <span class="text-[#6B7280] text-xs font-bold md:hidden">Skala Penilaian:</span>
                            
                            <!-- Skala Radio Buttons -->
                            <div class="flex items-center gap-4 md:w-[240px] shrink-0 justify-between md:justify-start">
                                <label v-for="val in 5" :key="val" class="flex flex-row items-center gap-2 cursor-pointer group">
                                    <div class="relative flex items-center justify-center">
                                        <input 
                                            type="radio" 
                                            :name="'rating_' + ind.id" 
                                            :value="val" 
                                            @change="setRating(ind.id, val)"
                                            class="peer sr-only"
                                        >
                                        <div class="w-5 h-5 rounded-full border border-[#9CA3AF] peer-checked:border-[6px] peer-checked:border-[#2A2C87] transition-all bg-white group-hover:border-[#2A2C87]"></div>
                                    </div>
                                    <span class="text-[#4B5563] text-[15px] font-['Be_Vietnam_Pro'] group-hover:text-[#2A2C87] transition-colors" :class="{'font-bold text-[#2A2C87]': ratings[ind.id] === val}">{{ val }}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Kritik dan Saran -->
                <div class="mt-8 mb-12 flex flex-col md:w-3/4 mx-auto max-w-[800px] items-center">
                    <div class="w-full">
                        <label class="text-[#374151] text-sm font-bold font-['Be_Vietnam_Pro'] mb-2 block text-center md:text-left">Kritik dan Saran</label>
                        <textarea 
                            v-model="form.komentar"
                            @blur="validate"
                            placeholder="Masukkan kritik dan saranmu disini...."
                            class="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 text-[#374151] text-[15px] min-h-[140px] focus:ring-[#2A2C87] focus:border-[#2A2C87] outline-none font-['Be_Vietnam_Pro'] resize-y shadow-sm"
                        ></textarea>
                        <span class="block text-right text-xs mt-1" :class="errors.komentar ? 'text-red-500 font-semibold' : 'text-[#9CA3AF]'">
                            {{ errors.komentar || (form.komentar.length > 0 ? form.komentar.length + ' karakter' : 'Minimal 20 karakter jika diisi') }}
                        </span>
                    </div>

                    <!-- Submit Button -->
                    <button 
                        type="submit"
                        :disabled="!isFormValid"
                        class="mt-8 bg-[#2A2C87] hover:bg-[#1E1F61] text-white font-['Be_Vietnam_Pro'] font-bold text-[15px] py-3.5 px-8 md:px-24 rounded-lg flex items-center justify-center gap-2 transition-all disabled:bg-[#A5A6D0] disabled:cursor-not-allowed shadow-md w-full md:w-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                        Kirim Penilaian
                    </button>
                </div>

            </form>
        </div>
    </div>
</template>

<style scoped>
.stf-page {
    min-height: 100vh;
    background: #F4F5F7; /* Match image off-white background */
    padding: 48px 24px;
    font-family: "Be Vietnam Pro", sans-serif;
}

.form-container {
    max-width: 1080px;
    margin: 0 auto;
}

@media (max-width: 768px) {
    .stf-page {
        padding: 32px 16px;
    }
}
</style>
