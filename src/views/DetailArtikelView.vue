<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiAuthGet, apiAuthDelete } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useArtikelStore } from '@/stores/artikel'
import SLoading from '@/components/SLoading.vue'
import SButton from '@/components/SButton.vue'
import SImage from '@/components/SImage.vue'
import SAlert from '@/components/SAlert.vue'

const route = useRoute()
const router = useRouter()
interface Artikel {
  id: number | string;
  judul: string;
  gambar: string | null;
  created_at: string;
  updated_at?: string;
  nama_penulis: string;
  konten: string;
  status?: string;
}

const auth = useAuthStore()
const artikelStore = useArtikelStore()
const artikel = ref<Artikel | null>(null)
const isLoading = ref(true)
const isDeleting = ref(false)
const showDeleteAlert = ref(false)
const isAdmin = computed(() => auth.user?.role === 'kemahasiswaan')

async function fetchArtikelDetail(id: string | string[]) {
  isLoading.value = true
  try {
    const data = await apiAuthGet(`artikel/${id}/`)
    artikel.value = data
  } catch (error) {
    if (error?.name === 'ServerHandledError') {
      console.error('[DetailArtikelView] Request failed (handled globally):', error.message);
      return;
    }
    console.error("Gagal memuat detail artikel:", error)
    router.push('/artikel')
  } finally {
    isLoading.value = false
  }
}

async function checkAndFetchArtikel() {
  const id = route.params.id
  if (id) {
    artikel.value = null
    await fetchArtikelDetail(id)
  }
}

onMounted(async () => {
  checkAndFetchArtikel()
})

// Watch route params to refetch
watch(() => route.params.id, async (newId) => {
  // Only fetch if we're still on the detailArtikel route
  if (newId && route.name === 'detailArtikel') {
    artikel.value = null
    await fetchArtikelDetail(newId)
  }
})

const formatTanggalDanJam = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  const formattedDate = date.toLocaleDateString('id-ID', dateOptions)
  const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${formattedDate} ${formattedTime}`
}

const getTimestampText = (artikel: Artikel) => {
  if (!artikel.created_at) return ''

  const createdDateTime = formatTanggalDanJam(artikel.created_at)

  // Compare only up to minutes (not including seconds/milliseconds)
  if (artikel.updated_at) {
    const createdDate = new Date(artikel.created_at)
    const updatedDate = new Date(artikel.updated_at)

    const isSameMinute =
      createdDate.getFullYear() === updatedDate.getFullYear() &&
      createdDate.getMonth() === updatedDate.getMonth() &&
      createdDate.getDate() === updatedDate.getDate() &&
      createdDate.getHours() === updatedDate.getHours() &&
      createdDate.getMinutes() === updatedDate.getMinutes()

    if (!isSameMinute) {
      const updatedDateTime = formatTanggalDanJam(artikel.updated_at)
      return `Created: ${createdDateTime} • Edited: ${updatedDateTime}`
    }
  }

  return createdDateTime
}

// Decode HTML entities and convert newlines to <br>
const decodeHtmlEntities = (text: string) => {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  const decoded = textarea.value
  // Convert newlines to <br> tags
  return decoded.replace(/\n/g, '<br>')
}

const openDeleteModal = () => {
  showDeleteAlert.value = true
}

const confirmDelete = async () => {
  if (!artikel.value) return
  
  isDeleting.value = true
  try {
    await apiAuthDelete(`artikel/${artikel.value.id}/`)
    showDeleteAlert.value = false
    
    // Clear artikel store cache to force refetch on next view
    artikelStore.daftarArtikel = []
    
    // Redirect back to artikel list (will trigger refetch via onActivated)
    setTimeout(() => {
      router.push('/artikel')
    }, 500)
  } catch (error) {
    console.error("Gagal menghapus artikel:", error)
    showDeleteAlert.value = false
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="stf-page">

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <p class="text-[#868686] font-['Be_Vietnam_Pro'] text-[15px]">Memuat data artikel...</p>
    </div>

    <div v-else-if="artikel" class="stf-container flex flex-col gap-6">

      <!-- Top Action Bar -->
      <div class="flex justify-between items-center w-full">
        <button
          @click="router.push('/artikel')"
          class="flex items-center gap-2 text-[#2e3094] font-['Be_Vietnam_Pro'] font-semibold text-[14px] hover:underline"
        >
          <span>&larr;</span> Kembali ke Portal
        </button>

        <div v-if="isAdmin" class="flex items-center gap-3">
          <SButton
            label="Edit Artikel"
            variant="primary"
            @click="router.push(`/edit-artikel/${artikel.id}`)"
          />
          <button
            @click="openDeleteModal"
            class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 sm:px-5 sm:py-4 text-sm sm:text-base transition-all duration-200 cursor-pointer font-semibold bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isDeleting"
          >
            {{ isDeleting ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
      </div>

      <!-- Delete Confirmation Alert -->
      <SAlert
        :visible="showDeleteAlert"
        type="warning"
        title="Hapus Artikel?"
        description="Tindakan ini menghapus artikel secara permanen dari portal. Data dan konten tidak dapat dikembalikan setelah dikonfirmasi."
        :primary-button-text="isDeleting ? 'Menghapus...' : 'Yakin, hapus'"
        secondary-button-text="Batal"
        @update:visible="showDeleteAlert = $event"
        @primary-click="confirmDelete"
      />

      <!-- Article Container -->
      <article class="bg-white rounded-2xl overflow-hidden border border-[#d9d9d9] shadow-sm">

        <!-- Hero Section -->
        <div class="relative w-full h-[320px] md:h-[451px] bg-gradient-to-br from-[#7374b7] via-[#5a5c99] to-[#2e3094]">
          <SImage 
            v-if="artikel.gambar"
            :src="artikel.gambar" 
            :alt="artikel.judul" 
            object-fit="cover"
            class="absolute inset-0 w-full h-full opacity-80 mix-blend-overlay"
          />
          <!-- Subtle diagonal pattern overlay -->
          <div v-else class="absolute inset-0 opacity-10">
            <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="diagonal-stripes" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="20" stroke="white" stroke-width="10" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diagonal-stripes)" />
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
                {{ getTimestampText(artikel) }}
              </span>
            </div>
            <h1 class="text-white font-['Be_Vietnam_Pro'] font-extrabold text-[32px] md:text-[40px] leading-[40px] md:leading-[48px]">
              {{ artikel.judul }}
            </h1>
          </div>
        </div>

        <!-- Body Section -->
        <div class="p-6 md:p-10 md:pt-4 flex flex-col">

          <!-- Content Wrapper -->
          <div class="w-full">
            <!-- Author Block -->
            <div class="flex items-center gap-4 pb-5 border-b border-[#d9d9d9] mb-6">
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
              <div v-html="decodeHtmlEntities(artikel.konten)"></div>
            </div>

          </div>
        </div>
      </article>

    </div>
  </div>
</template>

<style scoped>
/* Article Body Container */
.article-body {
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  width: 100%;
  max-width: 100%;
}

/* Deep selectors to properly style user-generated html based on Figma design tokens */
.article-body :deep(p) {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  color: #383838;
  margin-bottom: 24px;
  text-align: justify;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3) {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 800;
  color: #383838;
  margin-top: 32px;
  margin-bottom: 16px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
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

.article-body :deep(u) {
  text-decoration: underline;
}

.article-body :deep(ol) {
  list-style-type: decimal;
  margin-left: 24px;
  margin-bottom: 24px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 16px;
  line-height: 24px;
  color: #383838;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.article-body :deep(ul) {
  list-style-type: disc;
  margin-left: 24px;
  margin-bottom: 24px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 16px;
  line-height: 24px;
  color: #383838;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.article-body :deep(li) {
  margin-bottom: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
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
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.article-body :deep(blockquote p) {
  margin-bottom: 0;
  color: inherit;
  font-weight: inherit;
  font-style: inherit;
  text-align: left;
}
</style>
