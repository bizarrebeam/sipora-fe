<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEvaluasiGuruStore } from '@/stores/evaluasiGuru'
import SPagination from '@/components/SPagination.vue'

const router = useRouter()
const route = useRoute()
const evaluasiStore = useEvaluasiGuruStore()

const loading = ref(false)
const komentarList = ref<any[]>([])

const currentPage = ref(1)
const pageSize = ref(12) // Lebih enak 12 (kelipatan 2, 3, 4 untuk grid)

const guru = route.query.guru as string || ''
const semester = route.query.semester as string || ''
const tahun_ajaran = route.query.tahun_ajaran as string || ''

onMounted(async () => {
    loading.value = true
    try {
        await evaluasiStore.fetchRekapEvaluasi({
            guru,
            semester,
            tahun_ajaran,
        })
        
        if (evaluasiStore.rekapEvaluasi.length > 0) {
            komentarList.value = evaluasiStore.rekapEvaluasi[0].komentar || []
        }
    } catch (error) {
        console.error('Gagal mengambil detail komentar:', error)
    } finally {
        loading.value = false
    }
})

const totalPages = computed(() => Math.ceil(komentarList.value.length / pageSize.value))

const paginatedKomentar = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return komentarList.value.slice(start, end)
})

function goBack() {
    router.back()
}
</script>

<template>
    <div class="komentar-page">
        <div class="komentar-container">
            <div class="mb-4">
                <button
                    @click="goBack"
                    class="flex items-center gap-2 text-[#2e3094] font-['Be_Vietnam_Pro'] font-semibold text-[14px] hover:underline"
                >
                    <span>&larr;</span> Kembali
                </button>
            </div>

            <div class="komentar-header">
                <h1 class="komentar-page-title">Semua Komentar & Masukan</h1>
                <p class="komentar-page-subtitle" v-if="guru">
                    Untuk: <span class="font-bold text-gray-800">{{ guru }}</span> &bull; 
                    Periode: {{ semester }} {{ tahun_ajaran }}
                </p>
            </div>

            <div v-if="loading" class="text-center py-12 text-gray-500">
                Memuat komentar...
            </div>

            <div v-else-if="komentarList.length === 0" class="text-center py-12 bg-white rounded-xl border border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Belum ada komentar</h3>
                <p class="text-gray-500">Tidak ada komentar untuk guru pada periode ini.</p>
            </div>

            <div v-else class="flex flex-col gap-4">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div v-for="(kom, index) in paginatedKomentar" :key="index" class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">Kelas: {{ kom.kelas }}</span>
                        </div>
                        <p class="text-gray-700 text-sm">"{{ kom.komentar }}"</p>
                    </div>
                </div>

                <div v-if="totalPages > 1" class="flex justify-center mt-6">
                    <SPagination v-model="currentPage" :total-pages="totalPages" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.komentar-page {
    min-height: calc(100vh - 64px);
    background: var(--color-general-frame, #F9FAFB);
    padding: 24px 16px;
}

.komentar-container {
    max-width: 1100px;
    margin: 0 auto;
}

.komentar-page-title {
    font-family: var(--font-be-vietnam, 'Be Vietnam Pro', sans-serif);
    font-weight: 700;
    font-size: 24px;
    color: var(--color-general-black, #111827);
    margin-bottom: 4px;
}

.komentar-page-subtitle {
    font-family: var(--font-be-vietnam, 'Be Vietnam Pro', sans-serif);
    font-size: 14px;
    color: var(--color-neutral-500, #6B7280);
    margin-bottom: 24px;
}
</style>
