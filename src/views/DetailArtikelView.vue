<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiAuthGet } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import SLoading from '@/components/SLoading.vue'

const route = useRoute()
const router = useRouter()
interface Artikel {
  id: number | string;
  judul: string;
  gambar: string | null;
  created_at: string;
  nama_penulis: string;
  konten: string;
  status?: string;
}

const auth = useAuthStore()
const artikel = ref<Artikel | null>(null)
const isLoading = ref(true)

const isAdmin = computed(() => auth.user?.role === 'kemahasiswaan')

onMounted(async () => {
  try {
    const id = route.params.id
    const data = await apiAuthGet(`artikel/${id}/`)
    artikel.value = data
  } catch (error) {
    console.error("Gagal memuat detail artikel:", error)
    router.push('/kelola-artikel')
  } finally {
    isLoading.value = false
  }
})

const formatTanggal = (dateString: string) => {
  if (!dateString) return ''
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('id-ID', options)
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f5] py-10 px-6 md:py-[60px] md:px-[80px]">

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <SLoading />
    </div>

    <div v-else-if="artikel" class="max-w-[996px] mx-auto w-full flex flex-col gap-6">

      <!-- Top Action Bar -->
      <div class="flex justify-between items-center w-full">
        <button
          @click="router.push('/kelola-artikel')"
          class="flex items-center gap-2 text-[#2e3094] font-['Be_Vietnam_Pro'] font-semibold text-[14px] hover:underline"
        >
          <span>&larr;</span> Kembali ke Portal
        </button>

        <div v-if="isAdmin" class="flex items-center gap-3">
          <button
            @click="router.push(`/edit-artikel/${artikel.id}`)"
            class="h-10 px-4 bg-[#2e3094] hover:bg-blue-800 transition-colors rounded-lg flex items-center justify-center text-white font-['Be_Vietnam_Pro'] font-semibold text-[14px]"
          >
            Edit Artikel
          </button>
          <!-- Using standard red styling for delete to match Figma intent (even though it's outlined/ghost usually, Figma shows a solid red "Hapus" button) -->
          <button
            class="h-10 px-4 bg-[#ff6b6b] hover:bg-red-600 transition-colors rounded-lg flex items-center justify-center text-white font-['Be_Vietnam_Pro'] font-semibold text-[14px]"
          >
            Hapus
          </button>
        </div>
      </div>

      <!-- Article Container -->
      <article class="bg-white rounded-2xl overflow-hidden border border-[#d9d9d9] shadow-sm">

        <!-- Hero Section -->
        <div class="relative w-full h-[320px] md:h-[451px] bg-[#383838]">
          <img
            v-if="artikel.gambar"
            :src="artikel.gambar"
            :alt="artikel.judul"
            class="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
          />
          <div v-else class="absolute inset-0 w-full h-full flex items-center justify-center opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-32 h-32 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <!-- Dark gradient overlay for typography readability -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          <!-- Hero Content (Tags + Title) -->
          <div class="absolute bottom-0 left-0 w-full p-6 md:p-10 flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 bg-[#2e3094] text-white rounded font-['Be_Vietnam_Pro'] font-bold text-[12px] leading-[16px]">
                Artikel
              </span>
              <span class="text-white/80 font-['Be_Vietnam_Pro'] text-[14px]">
                {{ formatTanggal(artikel.created_at) }}
              </span>
            </div>
            <h1 class="text-white font-['Be_Vietnam_Pro'] font-extrabold text-[32px] md:text-[40px] leading-[40px] md:leading-[48px]">
              {{ artikel.judul }}
            </h1>
          </div>
        </div>

        <!-- Body Section -->
        <div class="p-6 md:p-10 flex flex-col items-center">

          <!-- Content Wrapper -->
          <div class="w-full max-w-[800px]">
            <!-- Author Block -->
            <div class="flex items-center gap-4 py-6 border-b border-[#d9d9d9] mb-8">
              <div class="w-12 h-12 bg-[#eaeaf4] rounded-full flex items-center justify-center text-[#2e3094]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="shrink-0 text-[#2e3094]">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="flex flex-col">
                <p class="font-['Be_Vietnam_Pro'] font-bold text-[#2e3094] text-[16px] leading-[24px]">
                  {{ artikel.nama_penulis || 'Tim Kemahasiswaan' }}
                </p>
                <p class="font-['Be_Vietnam_Pro'] text-[#7a7a7a] text-[12px] leading-[16px]">
                  Penulis/Kontributor
                </p>
              </div>
            </div>

            <!-- Rich Text Body -->
            <div class="article-body">
              <div v-html="artikel.konten"></div>
            </div>

          </div>
        </div>
      </article>

    </div>
  </div>
</template>

<style scoped>
/* Deep selectors to properly style user-generated html based on Figma design tokens */
.article-body :deep(p) {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  color: #383838;
  margin-bottom: 24px;
  text-align: justify;
}

.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3) {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 800;
  color: #383838;
  margin-top: 32px;
  margin-bottom: 16px;
}

.article-body :deep(h1) { font-size: 28px; line-height: 36px; }
.article-body :deep(h2) { font-size: 24px; line-height: 32px; }
.article-body :deep(h3) { font-size: 20px; line-height: 28px; }

.article-body :deep(strong),
.article-body :deep(b) {
  font-weight: 800;
}

.article-body :deep(i),
.article-body :deep(em) {
  font-style: italic;
  font-weight: 800;
}

.article-body :deep(ol) {
  list-style-type: decimal;
  margin-left: 24px;
  margin-bottom: 24px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 16px;
  line-height: 24px;
  color: #383838;
}

.article-body :deep(ul) {
  list-style-type: disc;
  margin-left: 24px;
  margin-bottom: 24px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 16px;
  line-height: 24px;
  color: #383838;
}

.article-body :deep(li) {
  margin-bottom: 8px;
}

/* Specific styling for highlight quotes matching Figma */
.article-body :deep(blockquote) {
  background-color: #bebfde;
  border-left: 4px solid #2e3094;
  padding: 16px 24px;
  margin-top: 32px;
  margin-bottom: 32px;
  border-radius: 0 8px 8px 0;
  font-family: "Be Vietnam Pro", sans-serif;
  font-style: italic;
  font-weight: 800;
  font-size: 16px;
  line-height: 24px;
  color: #2e3094;
}

.article-body :deep(blockquote p) {
  margin-bottom: 0;
  color: inherit;
  font-weight: inherit;
  font-style: inherit;
  text-align: left;
}
</style>
