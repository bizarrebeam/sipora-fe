<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useArtikelStore } from '@/stores/artikel'
import STextField from '@/components/STextField.vue'
import SPagination from '@/components/SPagination.vue'

const artikelStore = useArtikelStore()

// State
const searchQuery = ref('')
const statusFilter = ref<'published' | 'draft'>('published')
const currentPage = ref(1)
const pageSize = ref(9)

const formatTanggal = (dateString: string) => {
  if (!dateString) return '-'
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('id-ID', options)
}

const stripHtml = (html: string) => {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

const filteredData = computed(() => {
  return artikelStore.daftarArtikel.filter(artikel => {
    const matchesSearch = artikel.judul?.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = artikel.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / pageSize.value) || 1
})

onMounted(async () => {
  try {
    await artikelStore.fetchKelolaArtikel()
  } catch (error) {
    console.error('Gagal mengambil data artikel:', error)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f5] py-10 px-6 md:py-[60px] md:px-[80px]">
    <div class="max-w-[996px] mx-auto w-full flex flex-col gap-[42px]">

      <!-- Header -->
      <div class="flex flex-col gap-2">
        <h1 class="text-[28px] font-[800] text-[#2e3094] font-['Be_Vietnam_Pro'] leading-[36px]">Portal Artikel</h1>
        <div class="text-[20px] font-[600] text-[#383838] font-['Be_Vietnam_Pro'] leading-[28px]">
          <p>Portal artikel berisi materi edukasi untuk siswa SMP Desa Mulia Putra.</p>
          <p>Temukan tips menghadapi bullying, cara menjaga kesehatan mental, dan informasi penting lainnya.</p>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="flex flex-col md:flex-row items-center gap-4 justify-between w-full">
        <!-- Toggle Draft/Publikasi -->
        <div class="flex items-center bg-white border-[1.5px] border-[#d9d9d9] p-1 rounded-xl h-12 w-[208px] relative shrink-0">
          <div
            class="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out border border-[#d9d9d9]"
            :class="statusFilter === 'published' ? 'left-1' : 'left-[calc(50%+4px)]'"
          ></div>
          <button
            type="button"
            class="flex-1 relative z-10 font-['Be_Vietnam_Pro'] text-[16px] leading-[24px] focus:outline-none transition-colors duration-300 font-bold"
            :class="statusFilter === 'published' ? 'text-[#212269]' : 'text-[#aeaeae]'"
            @click="statusFilter = 'published'; currentPage = 1"
          >Publikasi</button>
          <button
            type="button"
            class="flex-1 relative z-10 font-['Be_Vietnam_Pro'] text-[16px] leading-[24px] focus:outline-none transition-colors duration-300 font-bold"
            :class="statusFilter === 'draft' ? 'text-[#212269]' : 'text-[#aeaeae]'"
            @click="statusFilter = 'draft'; currentPage = 1"
          >Draft</button>
        </div>

        <!-- Search Bar -->
        <div class="w-full md:w-[581px]">
          <STextField
            v-model="searchQuery"
            placeholder="Cari artikel berdasarkan judul..."
            @update:modelValue="currentPage = 1"
          />
        </div>

        <!-- Buat Artikel Button -->
        <router-link to="/create-artikel" class="w-full md:w-auto shrink-0">
          <button class="w-full md:w-auto h-12 bg-[#2e3094] hover:bg-blue-800 transition-colors text-white rounded-lg px-5 flex items-center justify-center gap-2 font-['Be_Vietnam_Pro'] font-semibold text-[16px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="shrink-0 text-white">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Buat Artikel
          </button>
        </router-link>
      </div>

      <!-- Pagination Top -->
      <div v-if="totalPages > 1" class="flex justify-start">
        <SPagination v-model="currentPage" :totalPages="totalPages" />
      </div>

      <!-- Empty State -->
      <div v-if="paginatedData.length === 0" class="text-center py-12">
        <p class="text-[#7a7a7a] font-['Be_Vietnam_Pro']">Tidak ada artikel yang ditemukan.</p>
      </div>

      <!-- Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="artikel in paginatedData"
          :key="artikel.id"
          class="bg-white border border-[#d9d9d9] flex flex-col h-[451px] rounded-[16px] overflow-hidden hover:shadow-lg transition-shadow"
        >
          <!-- Image -->
          <div class="h-[215px] relative shrink-0 bg-gray-200">
            <img
              v-if="artikel.gambar"
              :src="artikel.gambar"
              class="absolute inset-0 w-full h-full object-cover pointer-events-none"
              :alt="artikel.judul"
            />
            <div v-else class="absolute inset-0 flex items-center justify-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="flex flex-col p-4 flex-1">
            <div class="flex justify-between items-center text-[#7a7a7a] font-['Be_Vietnam_Pro'] font-medium mb-3">
              <span class="text-[#2e3094] font-semibold text-[10px] md:text-xs line-clamp-1 mr-2">{{ artikel.nama_penulis || 'Tim Kemahasiswaan' }}</span>
              <span class="text-[10px] md:text-xs shrink-0">{{ formatTanggal(artikel.created_at) }}</span>
            </div>

            <div class="flex flex-col gap-1 mb-auto">
              <h3 class="font-['Be_Vietnam_Pro'] font-extrabold text-[#383838] text-[16px] leading-[24px] line-clamp-2" :title="artikel.judul">
                {{ artikel.judul }}
              </h3>
              <p class="font-['Be_Vietnam_Pro'] text-[#7a7a7a] text-[12px] leading-[16px] line-clamp-3 mt-1" :title="artikel.ringkasan || stripHtml(artikel.konten)">
                {{ artikel.ringkasan || stripHtml(artikel.konten) }}
              </p>
            </div>

            <!-- Button -->
            <router-link :to="`/artikel/${artikel.id}`" class="mt-4">
              <button class="w-full bg-[#2e3094] hover:bg-blue-800 transition-colors text-white rounded-lg h-9 flex items-center justify-center gap-2 font-['Be_Vietnam_Pro'] font-semibold text-[12px]">
                Baca Selengkapnya
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </router-link>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
