<script setup lang="ts">
// ---
// KelolaArtikelView
// This view manages and displays a list of articles for both admin and public users.
// Admins can filter by status (published/draft), search, and create new articles.
// Pagination, search, and card display are supported.
// ---
import { onMounted, onActivated, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useArtikelStore } from '@/stores/artikel'
import { useAuthStore } from '@/stores/auth'
import SButton from '@/components/SButton.vue'
import STextField from '@/components/STextField.vue'
import SPagination from '@/components/SPagination.vue'
import SCard from '@/components/SCard.vue'
import SImage from '@/components/SImage.vue'

// Store and router setup
const artikelStore = useArtikelStore()
const auth = useAuthStore()
const router = useRouter()

// --- State ---
/**
 * Search query for filtering articles by title
 */
const searchQuery = ref('')
/**
 * Status filter for admin (published/draft)
 */
const statusFilter = ref<'published' | 'draft'>('published')
/**
 * Sorting for displaying articles
 */
const sortOrder = ref<'terbaru' | 'terlama'>('terbaru')
/**
 * Current page for pagination
 */
const currentPage = ref(1)
/**
 * Number of articles per page
 */
const pageSize = ref(4)
/**
 * Loading state for data fetching
 */
const loading = ref(false)

/**
 * Computed property to check if the current user is an admin (kemahasiswaan)
 */
const isAdmin = computed(() => auth.user?.role === 'kemahasiswaan')

/**
 * Format a date string into a readable date and time (Indonesian locale).
 * @param {string} dateString
 * @returns {string}
 */
const formatTanggalDanJam = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
  const formattedDate = date.toLocaleDateString('id-ID', dateOptions)
  const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${formattedDate} ${formattedTime}`
}

/**
 * Remove HTML tags from a string, used for displaying plain text summaries.
 * @param {string} html
 * @returns {string}
 */
const stripHtml = (html: string) => {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

/**
 * Interface for article card data
 */
interface ArtikelCard {
  id: number | string
  created_at: string
  updated_at?: string
  nama_penulis?: string
  judul: string
  ringkasan?: string
  konten: string
  gambar?: string | null
  status?: string
}

/**
 * Get a formatted timestamp string for created/updated times.
 * @param {ArtikelCard} artikel
 * @returns {string}
 */
const getTimestampText = (artikel: ArtikelCard) => {
  if (!artikel.created_at) return '-'
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
      return `Created: ${createdDateTime}\n Edited: ${updatedDateTime}`
    }
  }
  return createdDateTime
}

/**
 * Computed property for filtered articles based on search and status.
 */
const filteredData = computed(() => {
  return artikelStore.daftarArtikel.filter(artikel => {
    const matchesSearch = (artikel.judul || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = isAdmin.value
        ? (artikel.status || '').toLowerCase() === statusFilter.value.toLowerCase()
        : true;
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    if (sortOrder.value === 'terbaru') return dateB - dateA
    return dateA - dateB
  })
})

/**
 * Total number of filtered articles
 */
const totalData = computed(() => filteredData.value.length)
/**
 * Total number of pages for pagination
 */
const totalPages = computed(() => Math.ceil(totalData.value / pageSize.value) || 1)

/**
 * Paginated articles for current page
 */
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

/**
 * Navigate to the detail page for a specific article
 * @param {number | string} id
 */
const goToDetail = (id: number | string) => {
  if (!id) {
    console.error("ID Artikel tidak ditemukan!");
    return;
  }
  router.push({ name: 'detailArtikel', params: { id } });
};

let fetchTimeout: ReturnType<typeof setTimeout>
function debouncedFetch() {
  clearTimeout(fetchTimeout)
  fetchTimeout = setTimeout(() => {
    fetchData()
  }, 400)
}

watch([searchQuery, statusFilter, sortOrder], () => {
  currentPage.value = 1
  debouncedFetch()
})

/**
 * Fetch articles from the store depending on user role (admin/public)
 */
async function fetchData() {
  loading.value = true
  try {
    if (isAdmin.value) {
      await artikelStore.fetchKelolaArtikel()
    } else {
      await artikelStore.fetchArtikelPublik()
    }
  } catch (error) {
    console.error('Gagal mengambil data artikel:', error)
  } finally {
    loading.value = false
  }
}

// Fetch data on mount
onMounted(() => fetchData())

onActivated(() => {
  fetchData()
})

// Reset to first page when search query changes
watch(searchQuery, () => { currentPage.value = 1 })
</script>

<template>
  <div class="stf-page">
    <div class="stf-container">
      <div class="stf-header flex justify-between items-start gap-4">
        <div class="stf-header-text">
          <h1 class="stf-page-title">Portal Artikel</h1>
          <p class="stf-page-subtitle">
              Portal artikel berisi materi edukasi untuk siswa SMP Desa Mulia Putra.<br>
              Temukan tips menghadapi bullying, cara menjaga kesehatan mental, dan informasi penting lainnya.
          </p>
        </div>

        <SButton
          v-if="isAdmin"
          label="Buat Artikel"
          variant="primary"
          @click="router.push({ name: 'createArtikel' })"
          class="shrink-0 mt-2"
        >
          <template #left-icon>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 8V14M16 11H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </SButton>
      </div>

      <div class="filters-row">
        <div class="filter-search">
          <STextField
            v-model="searchQuery"
            placeholder="Cari artikel berdasarkan judul..."
            variant="text"
            class="w-full"
          />
        </div>

        <div class="filter-extras">
          <div class="toggle-container" v-if="isAdmin">
            <div class="toggle-slider" :class="{ 'toggle-slider--draft': statusFilter === 'draft' }"></div>
            <button
              @click="statusFilter = 'published'; currentPage = 1"
              class="toggle-btn"
              :class="{ 'toggle-btn--active': statusFilter === 'published' }"
            >
              Publikasi
            </button>
            <button
              @click="statusFilter = 'draft'; currentPage = 1"
              class="toggle-btn"
              :class="{ 'toggle-btn--active': statusFilter === 'draft' }"
            >
              Draft
            </button>
          </div>

          <div class="sort-select-wrapper">
            <select
              v-model="sortOrder"
              class="filter-input-select"
            >
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
            </select>
            <div class="select-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="card-pagination">
        <SPagination v-model="currentPage" :total-pages="totalPages" />
      </div>

      <div v-if="loading" class="loading-state">
        <p>Memuat data...</p>
      </div>

      <template v-else>
        <div v-if="paginatedData.length === 0" class="s-empty-state">
          <svg class="s-empty-state__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="s-empty-state__title">Tidak ada artikel</h3>
          <p class="s-empty-state__desc">Belum ada artikel di kategori ini.</p>
        </div>

        <div v-else class="card-grid">
          <SCard
            v-for="artikel in paginatedData"
            :key="artikel.id"
            class="article-card"
            padding="0"
            @click="router.push({ name: 'detailArtikel', params: { id: artikel.id } })"
          >
            <div class="article-thumb">
              <div v-if="artikel.status === 'draft'" class="draft-badge">
                Draft
              </div>

              <SImage v-if="artikel.gambar" :src="artikel.gambar" :alt="artikel.judul" object-fit="cover" />
            </div>

            <div class="article-card-content">
              <div class="article-card__top">
                <span class="author-tag">{{ artikel.nama_penulis || 'Tim Kemahasiswaan' }}</span>
                <span class="article-card__date">{{ getTimestampText(artikel) }}</span>
              </div>

              <h4 class="article-card__title">
                {{ artikel.judul }}
              </h4>

              <p class="article-card__desc">
                {{ artikel.ringkasan || stripHtml(artikel.konten) }}
              </p>

              <div class="article-card__footer">
                <button class="aksi-btn--baca" @click.stop="goToDetail(artikel.id)">
                  Baca Selengkapnya
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </SCard>
        </div>
      </template>

    </div>
  </div>
</template>

<style scoped>
.toggle-container {
	position: relative;
	display: inline-flex;
	background: white;
	border: 1.5px solid var(--color-general-border);
	border-radius: 12px;
	padding: 1.5px;
	height: 48px;
	width: 208px;
	align-items: center;
}

.toggle-slider {
	position: absolute;
	top: 1.5px;
	left: 1.5px;
	height: 42px;
	width: 99px;
	background: #9FA0CE;
	border-radius: 10px;
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	z-index: 1;
}

.toggle-slider--draft {
	transform: translateX(103px);
}

.toggle-btn {
	position: relative;
	z-index: 2;
	flex: 1;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 16px;
	line-height: 24px;
	border: none;
	background: transparent;
	cursor: pointer;
	color: var(--color-neutral-300);
	transition: color 0.3s ease;
}

.toggle-btn--active {
	font-weight: 700;
	color: var(--color-blue-700);
}

.filters-row {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: stretch;
}

.filter-search {
  flex: 1;
  min-width: 0;
}

.filter-extras {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.sort-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-input-select {
  border: 1px solid var(--color-general-border);
  border-radius: 8px;
  padding: 10px 40px 10px 14px;
  height: 52px;
  font-size: 15px;
  font-family: "Be Vietnam Pro", sans-serif;
  color: var(--color-general-black);
  background: white;
  transition: border-color 0.2s;
  min-width: 140px;
  appearance: none;
  cursor: pointer;
  border-width: 1.5px;
}

.filter-input-select:focus {
  outline: none;
  border-color: var(--color-blue-500);
}

.select-icon {
  position: absolute;
  right: 14px;
  pointer-events: none;
  color: var(--color-neutral-400);
}

.search-container {
	background: white;
	border-radius: 8px;
}

.loading-state {
	text-align: center;
	padding: 40px 0;
	color: var(--color-neutral-500);
	font-family: "Be Vietnam Pro", sans-serif;
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-extras {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .toggle-container {
    width: 100%;
    justify-content: center;
  }

  .toggle-slider {
    width: calc(50% - 1.5px);
  }

  .toggle-slider--draft {
    transform: translateX(100%);
  }

  .filter-input-select {
    width: 100%;
  }

  .sort-select-wrapper {
    width: 100%;
  }
}

/* Card View */

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
	.card-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 768px) {
	.card-grid {
		grid-template-columns: 1fr;
	}
}

.article-card {
	cursor: pointer;
	transition: 0.2s;
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 450px;
}

.article-card:hover {
	transform: translateY(-3px);
	box-shadow: 0 8px 16px rgba(0,0,0,0.05);
}

.article-thumb {
  position: relative;
  aspect-ratio: 16/9;
  width: 100%;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  background: #f0f0f0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.article-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}


.draft-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: #3F429B;
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 12px;
  font-weight: 600;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f3f4fa;
  color: #6b6b8d;
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 1px;
}

.thumb-initial {
  font-size: 48px;
  font-weight: 800;
  color: #b3b5d1;
  font-family: "Be Vietnam Pro", sans-serif;
}

.article-card-content {
	padding: 16px 12px;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.article-card__top {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 12px;
	gap: 12px;
}

.author-tag {
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 600;
	font-size: 10px;
	color: var(--color-blue-500);
	flex: 1;
}

.article-card__date {
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 10px;
	color: var(--color-neutral-600);
	flex: 1;
	text-align: right;
	white-space: pre-line;
}

.article-card__title {
	font-family: "Be Vietnam Pro", sans-serif;
	font-weight: 800;
	font-size: 16px;
	line-height: 24px;
	color: var(--color-neutral-900);
	margin: 0 0 4px 0;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.article-card__desc {
  font-family: "Be Vietnam Pro", sans-serif;
  font-size: 12px;
  color: var(--color-neutral-600);
  line-height: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 16px 0;
  text-align: justify;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

.article-card__footer {
	margin-top: auto;
}

.aksi-btn--baca {
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
	padding: 10px 20px;
	background: var(--color-blue-500);
	color: white;
	border-radius: 8px;
	font-weight: 600;
	font-family: "Be Vietnam Pro", sans-serif;
	font-size: 12px;
	line-height: 16px;
	border: none;
	cursor: pointer;
	transition: background 0.2s;
}

.aksi-btn--baca:hover {
	background: var(--color-blue-700);
}

.card-pagination {
	margin-top: 32px;
	display: flex;
	justify-content: flex-start;
  margin-bottom: 32px;
}
</style>
