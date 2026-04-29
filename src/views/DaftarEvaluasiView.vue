<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEvaluasiGuruStore } from '@/stores/evaluasiGuru'
import SCard from '@/components/SCard.vue'
import SDropDown from '@/components/SDropDown.vue'
import STextField from '@/components/STextField.vue'
import SPagination from '@/components/SPagination.vue'
import SButton from '@/components/SButton.vue'

const auth = useAuthStore()
const evaluasiStore = useEvaluasiGuruStore()

const isKemahasiswaan = computed(() => auth.user?.role === 'kemahasiswaan')
const isGuru = computed(() => auth.user?.role === 'guru')

const searchGuru = ref('')
const selectedTahunAjaran = ref('')
const selectedSemester = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const loading = ref(false)

const tahunAjaranOptions = [
    { label: 'Semua Tahun', value: '' },
    { label: '2023/2024', value: '2023/2024' },
    { label: '2024/2025', value: '2024/2025' },
    { label: '2025/2026', value: '2025/2026' }
]

const semesterOptions = [
    { label: 'Semua Semester', value: '' },
    { label: 'Ganjil', value: 'Ganjil' },
    { label: 'Genap', value: 'Genap' }
]

let fetchTimeout: ReturnType<typeof setTimeout>
function debouncedFetch() {
    clearTimeout(fetchTimeout)
    fetchTimeout = setTimeout(() => {
        currentPage.value = 1
        fetchData()
    }, 400)
}

watch([searchGuru, selectedTahunAjaran, selectedSemester], () => {
    debouncedFetch()
})

watch(currentPage, (newVal, oldVal) => {
    if (newVal !== oldVal) fetchData()
})

async function fetchData() {
    loading.value = true
    try {
        await evaluasiStore.fetchRekapEvaluasi({
            guru: isKemahasiswaan.value ? searchGuru.value : undefined,
            tahun_ajaran: selectedTahunAjaran.value,
            semester: selectedSemester.value,
            page: currentPage.value,
            page_size: pageSize.value
        })
    } catch (error) {
        console.error(error)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchData()
})

const totalPages = computed(() => Math.ceil(evaluasiStore.totalRekap / pageSize.value))
</script>

<template>
    <div class="rekap-page">
        <div class="rekap-container">
            <div class="rekap-header">
                <div class="rekap-header-text">
                    <h1 class="rekap-page-title">Rekap Evaluasi Guru</h1>
                    <p class="rekap-page-subtitle">
                        {{ isKemahasiswaan ? 'Pantau hasil evaluasi seluruh guru dari siswa.' : 'Lihat hasil evaluasi kinerja Anda dari siswa.' }}
                    </p>
                </div>
            </div>

            <div class="filter-section flex flex-col md:flex-row gap-4 mb-6">
                <div v-if="isKemahasiswaan" class="w-full md:w-1/3">
                    <STextField 
                        v-model="searchGuru" 
                        placeholder="Cari nama guru..." 
                    />
                </div>
                <div class="w-full md:w-1/4">
                    <SDropDown 
                        v-model="selectedTahunAjaran" 
                        :options="tahunAjaranOptions" 
                        placeholder="Tahun Ajaran" 
                    />
                </div>
                <div class="w-full md:w-1/4">
                    <SDropDown 
                        v-model="selectedSemester" 
                        :options="semesterOptions" 
                        placeholder="Semester" 
                    />
                </div>
            </div>

            <div v-if="loading && evaluasiStore.rekapEvaluasi.length === 0" class="text-center py-12 text-gray-500">
                Memuat data rekap evaluasi...
            </div>

            <div v-else-if="evaluasiStore.rekapEvaluasi.length === 0" class="text-center py-12 bg-white rounded-xl border border-gray-200">
                <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="text-lg font-medium text-gray-900">Belum ada data evaluasi</h3>
                <p class="text-gray-500">Tidak ditemukan hasil evaluasi yang sesuai dengan filter.</p>
            </div>

            <div v-else class="flex flex-col gap-8">
                <div v-for="(rekap, index) in evaluasiStore.rekapEvaluasi" :key="index" class="rekap-item bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    
                    <div class="mb-6 border-b pb-4 flex flex-wrap justify-between items-end gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-900">{{ rekap.guru_nama }}</h2>
                            <p class="text-sm text-gray-500 font-medium mt-1">Periode: {{ rekap.semester }} {{ rekap.tahun_ajaran }}</p>
                        </div>
                        <div class="flex gap-4 text-center">
                            <div class="bg-blue-50 px-4 py-2 rounded-lg">
                                <p class="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total Responden</p>
                                <p class="text-xl font-black text-blue-700">{{ rekap.total_responden }} Siswa</p>
                            </div>
                            <div class="bg-amber-50 px-4 py-2 rounded-lg">
                                <p class="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Rata-Rata Total</p>
                                <p class="text-xl font-black text-amber-600">{{ rekap.rata_rata_rating }} / 5.0</p>
                            </div>
                        </div>
                    </div>

                    <!-- Cards Rata-Rata per Kategori -->
                    <div class="mb-8">
                        <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Rata-Rata Nilai per Kategori</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div v-for="kat in rekap.detail_kategori" :key="kat.kategori_id" class="border border-gray-100 bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                                <span class="font-semibold text-gray-800 text-sm">{{ kat.kategori_nama }}</span>
                                <span class="text-lg font-black" :class="kat.rata_rata >= 4.0 ? 'text-green-600' : (kat.rata_rata >= 3.0 ? 'text-amber-500' : 'text-red-500')">
                                    {{ kat.rata_rata }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Tabel Detail Indikator -->
                    <div class="mb-8">
                        <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Rincian Nilai Indikator</h3>
                        <div class="overflow-hidden rounded-xl border border-gray-200">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">Kategori</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-2/3">Indikator Penilaian</th>
                                        <th scope="col" class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Rata-Rata</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <template v-for="kat in rekap.detail_kategori" :key="'table-' + kat.kategori_id">
                                        <tr v-for="(ind, idx) in kat.detail_indikator" :key="ind.indikator_id" class="hover:bg-gray-50 transition-colors">
                                            <!-- Kategori cell with rowspan -->
                                            <td v-if="idx === 0" :rowspan="kat.detail_indikator.length" class="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-gray-200 bg-white align-top">
                                                {{ kat.kategori_nama }}
                                            </td>
                                            <td class="px-6 py-4 text-sm text-gray-700">
                                                {{ ind.deskripsi }}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-bold" :class="ind.rata_rata >= 4.0 ? 'text-green-600' : (ind.rata_rata >= 3.0 ? 'text-amber-500' : 'text-red-500')">
                                                {{ ind.rata_rata }}
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Komentar Siswa -->
                    <div>
                        <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Komentar & Masukan Siswa ({{ rekap.komentar.length }})</h3>
                        <div v-if="rekap.komentar.length === 0" class="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg border border-gray-100">
                            Tidak ada komentar untuk periode ini.
                        </div>
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div v-for="(kom, kIdx) in rekap.komentar" :key="kIdx" class="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">Kelas: {{ kom.kelas }}</span>
                                </div>
                                <p class="text-gray-700 text-sm">"{{ kom.komentar }}"</p>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="flex justify-center mt-4">
                    <SPagination v-model="currentPage" :total-pages="totalPages" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.rekap-page {
    min-height: calc(100vh - 64px);
    background: var(--color-general-frame, #F9FAFB);
    padding: 24px 16px;
}

.rekap-container {
    max-width: 1100px;
    margin: 0 auto;
}

.rekap-page-title {
    font-family: var(--font-be-vietnam, 'Be Vietnam Pro', sans-serif);
    font-weight: 700;
    font-size: 24px;
    color: var(--color-general-black, #111827);
    margin-bottom: 4px;
}

.rekap-page-subtitle {
    font-family: var(--font-be-vietnam, 'Be Vietnam Pro', sans-serif);
    font-size: 14px;
    color: var(--color-neutral-500, #6B7280);
    margin-bottom: 24px;
}

.rekap-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 0;
}
</style>
