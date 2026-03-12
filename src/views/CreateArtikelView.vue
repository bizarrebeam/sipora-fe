<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useArtikelStore } from '@/stores/artikel'
import { toast } from 'vue-sonner'
import STextField from '@/components/STextField.vue'
import SButton from '@/components/SButton.vue'
import SLoading from '@/components/SLoading.vue'

const router = useRouter()
const route = useRoute()
const artikelStore = useArtikelStore()

const isLoading = ref(true)
const articleId = route.params.id ? String(route.params.id) : null
const isEditMode = computed(() => !!articleId)

const formData = ref({
  judul: '',
  konten: '',
  ringkasan: '',
})

// Edge case constants
const JUDUL_MIN_CHARS = 5
const JUDUL_MAX_CHARS = 70
const KONTEN_MIN_CHARS = 400
const KONTEN_MAX_CHARS = 10000
const RINGKASAN_MIN_CHARS = 5
const RINGKASAN_MAX_CHARS = 150
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewImage = ref<string | null>(null)
const isDragging = ref(false)

// Computed properties untuk tracking karakter
const judulCharCount = computed(() => formData.value.judul.length)
const kontenCharCount = computed(() => formData.value.konten.length)
const ringkasanCharCount = computed(() => formData.value.ringkasan.length)

const isJudulValid = computed(() => judulCharCount.value >= JUDUL_MIN_CHARS && judulCharCount.value <= JUDUL_MAX_CHARS)
const isKontenValid = computed(() => kontenCharCount.value >= KONTEN_MIN_CHARS && kontenCharCount.value <= KONTEN_MAX_CHARS)
// Ringkasan opsional: hanya invalid jika tidak kosong DAN tidak memenuhi kriteria
const isRingkasanValid = computed(() => ringkasanCharCount.value === 0 || (ringkasanCharCount.value >= RINGKASAN_MIN_CHARS && ringkasanCharCount.value <= RINGKASAN_MAX_CHARS))

// Check apakah form bisa disubmit
const isFormValid = computed(() => isJudulValid.value && isKontenValid.value && isRingkasanValid.value)

// Auto-generate ringkasan dari paragraf pertama
const autoGenerateRingkasan = () => {
  const text = formData.value.konten.trim()
  if (!text) return ''

  // Get first paragraph (split by double newline or first 300 chars)
  const firstParagraph = text.split('\n\n')[0] || text.substring(0, RINGKASAN_MAX_CHARS)

  if (firstParagraph.length > RINGKASAN_MAX_CHARS) {
    return firstParagraph.substring(0, RINGKASAN_MAX_CHARS).trim() + '...'
  }

  return firstParagraph.trim()
}

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    processFile(file)
  }
}

const processFile = (file: File) => {
  // Validate size (max 5MB)
  if (file.size > MAX_FILE_SIZE) {
    toast.error('Ukuran file maksimal 5MB')
    return
  }
  // Validate type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.error('Format file harus PNG, JPEG, atau WebP')
    return
  }

  selectedFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const isSubmitting = ref(false)
const kontenEditorRef = ref<HTMLTextAreaElement | null>(null)
const isList = ref(false)

// Auto-resize textarea untuk ringkasan
const autoResizeTextarea = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px'
}

// Format text di textarea
const formatText = (startTag: string, endTag: string = '') => {
  const textarea = kontenEditorRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = formData.value.konten.substring(start, end)

  if (!selectedText) {
    // Jika tidak ada selection, insert tag kosong
    const beforeText = formData.value.konten.substring(0, start)
    const afterText = formData.value.konten.substring(start)
    formData.value.konten = beforeText + startTag + afterText
  } else {
    // Wrap selected text dengan tag
    const beforeText = formData.value.konten.substring(0, start)
    const afterText = formData.value.konten.substring(end)
    formData.value.konten = beforeText + startTag + selectedText + endTag + afterText
  }

  // Focus kembali ke textarea
  setTimeout(() => {
    textarea.focus()
    textarea.selectionStart = start + startTag.length
    textarea.selectionEnd = start + startTag.length + selectedText.length
  }, 0)
}

const submitArticle = async (status: 'draft' | 'published') => {
  // Validasi judul
  if (!formData.value.judul.trim()) {
    toast.error('Judul artikel wajib diisi')
    return
  }
  if (formData.value.judul.length < JUDUL_MIN_CHARS) {
    toast.error(`Judul minimal ${JUDUL_MIN_CHARS} karakter`)
    return
  }
  if (formData.value.judul.length > JUDUL_MAX_CHARS) {
    toast.error(`Judul maksimal ${JUDUL_MAX_CHARS} karakter`)
    return
  }

  // Validasi konten
  if (!formData.value.konten.trim()) {
    toast.error('Isi artikel wajib diisi')
    return
  }
  if (formData.value.konten.length < KONTEN_MIN_CHARS) {
    toast.error(`Isi artikel minimal ${KONTEN_MIN_CHARS} karakter`)
    return
  }
  if (formData.value.konten.length > KONTEN_MAX_CHARS) {
    toast.error(`Isi artikel maksimal ${KONTEN_MAX_CHARS} karakter`)
    return
  }

  // Validasi ringkasan (opsional tapi jika ada harus valid)
  if (formData.value.ringkasan.length > RINGKASAN_MAX_CHARS) {
    toast.error(`Ringkasan maksimal ${RINGKASAN_MAX_CHARS} karakter`)
    return
  }

  isSubmitting.value = true

  try {
    // Auto-generate ringkasan dari paragraf pertama jika kosong
    let finalRingkasan = formData.value.ringkasan.trim()
    if (!finalRingkasan) {
      finalRingkasan = autoGenerateRingkasan()
    }

    const data = new FormData()
    data.append('judul', formData.value.judul.trim())
    data.append('konten', formData.value.konten.trim())
    data.append('ringkasan', finalRingkasan)
    data.append('status', status)

    if (selectedFile.value) {
      data.append('gambar', selectedFile.value)
    }

    if (isEditMode.value && articleId) {
      // Update existing artikel
      await artikelStore.updateArtikel(articleId, data)
      toast.success('Artikel berhasil diperbarui')
    } else {
      // Create new artikel
      await artikelStore.simpanArtikel(data)
      toast.success(`Artikel berhasil disimpan sebagai ${status === 'draft' ? 'Draft' : 'Publikasi'}`)
    }

    router.push('/kelola-artikel')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan artikel'
    toast.error(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

const toggleList = () => {
  isList.value = !isList.value;
    formatText('\n• ')
};


// Fetch artikel data saat edit mode
onMounted(async () => {
  if (isEditMode.value && articleId) {
    try {
      const data = await artikelStore.fetchDetailArtikel(articleId)
      formData.value.judul = data.judul || ''
      formData.value.konten = data.konten || ''
      formData.value.ringkasan = data.ringkasan || ''
      if (data.gambar) {
        previewImage.value = data.gambar
      }
    } catch (error) {
      console.error(error)
      toast.error('Gagal mengambil data artikel')
      router.push('/kelola-artikel')
    }
  }
  isLoading.value = false
})
</script>

<template>
  <div class="artikel-page">
    <div class="artikel-container">
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <SLoading />
      </div>

      <template v-else>
        <!-- Back Button -->
        <div>
          <button
            @click="router.push('/kelola-artikel')"
            class="flex items-center gap-2 text-[#2e3094] font-['Be_Vietnam_Pro'] font-semibold text-[14px] hover:underline"
          >
            <span>&larr;</span> Kembali
          </button>
        </div>

        <!-- Header -->
        <div class="artikel-header">
          <div>
            <h1 class="text-2xl font-bold mb-2 font-display text-[var(--color-general-black)]">
              {{ isEditMode ? 'Edit Artikel' : 'Menyusun Artikel' }}
            </h1>
            <p class="text-gray-500 mb-6 font-display text-sm">
              {{ isEditMode ? 'Perbarui detail artikel yang sudah dibuat.' : 'Masukan detail publikasi yang akan dibagikan ke portal siswa.' }}<br>
              Berikan informasi berkualitas dan bermanfaat untuk siswa SMP Desa Mulia Putra.
            </p>
          </div>
        </div>

        <!-- Form Container -->
        <div class="bg-[#eaeaf4] rounded-[16px] p-6 md:p-10 flex flex-col gap-8">

        <!-- Upload Cover -->
        <div class="flex flex-col gap-2">
          <label class="text-[#383838] font-['Be_Vietnam_Pro'] font-bold text-[14px]">Gambar Sampul (Cover)</label>

          <div
            v-if="!previewImage"
            class="w-full bg-white border border-[#d9d9d9] rounded-xl h-[200px] flex flex-col items-center justify-center cursor-pointer transition-colors duration-200"
            :class="isDragging ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-400 hover:bg-neutral-50'"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <div class="w-12 h-12 bg-[#7374b7] rounded-full flex items-center justify-center text-white mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="shrink-0 text-white">
                <path d="M12 4v16m0-16l-4 4m4-4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="text-[#aeaeae] font-['Be_Vietnam_Pro'] text-center text-xs md:text-sm px-4">
              Masukkan gambar dengan format PNG, JPEG, atau WebP (Max. 5 MB)
            </p>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/png, image/jpeg, image/webp"
              @change="handleFileSelect"
            />
          </div>

          <div v-else class="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden group">
            <img :src="previewImage" class="w-full h-full object-cover" alt="Preview Cover" />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <button
                @click="triggerFileInput"
                class="pointer-events-auto bg-white text-[#2e3094] px-6 py-2 rounded-lg font-['Be_Vietnam_Pro'] font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
              >
                Ganti Gambar
              </button>
            </div>
          </div>
        </div>

        <!-- Judul -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="text-[#383838] font-['Be_Vietnam_Pro'] font-bold text-[14px]">
              Judul Artikel <span class="text-red-500">*</span>
            </label>
            <span class="text-xs text-gray-500 font-['Be_Vietnam_Pro']">{{ judulCharCount }}/{{ JUDUL_MAX_CHARS }}</span>
          </div>
          <STextField
            v-model="formData.judul"
            placeholder="Tuliskan judul artikel yang ringkas dan menarik..."
            :maxlength="JUDUL_MAX_CHARS"
          />
          <span v-if="!isJudulValid && judulCharCount > 0" class="text-xs text-red-500 font-['Be_Vietnam_Pro']">
            {{ judulCharCount < JUDUL_MIN_CHARS ? `Judul minimal ${JUDUL_MIN_CHARS} karakter` : `Judul maksimal ${JUDUL_MAX_CHARS} karakter` }}
          </span>
        </div>

        <!-- Ringkasan (Opsional) -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="text-[#383838] font-['Be_Vietnam_Pro'] font-bold text-[14px]">
              Ringkasan Artikel <span class="text-gray-400 text-xs">(Opsional)</span>
            </label>
            <span class="text-xs text-gray-500 font-['Be_Vietnam_Pro']">{{ ringkasanCharCount }}/{{ RINGKASAN_MAX_CHARS }}</span>
          </div>
          <textarea
            v-model="formData.ringkasan"
            class="w-full min-h-[100px] p-3 font-['Be_Vietnam_Pro'] text-[14px] text-gray-800 focus:outline-none border border-[#d9d9d9] bg-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 resize-none overflow-auto placeholder:text-neutral-300"
            placeholder="Tuliskan ringkasan singkat artikel (atau akan diambil secara otomatis dari paragraf pertama)..."
            :maxlength="RINGKASAN_MAX_CHARS"
            @input="autoResizeTextarea"
          />
          <span v-if="ringkasanCharCount > 0 && !isRingkasanValid" class="text-xs text-red-500 font-['Be_Vietnam_Pro']">
            {{ ringkasanCharCount < RINGKASAN_MIN_CHARS ? `Ringkasan minimal ${RINGKASAN_MIN_CHARS} karakter` : `Ringkasan maksimal ${RINGKASAN_MAX_CHARS} karakter` }}
          </span>
          <span v-else-if="formData.ringkasan.length === 0" class="text-xs text-gray-400 font-['Be_Vietnam_Pro'] italic">
            Ringkasan akan diambil secara otomatis dari paragraf pertama jika tidak diisi
          </span>
        </div>

        <!-- Isi Artikel -->
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="text-[#383838] font-['Be_Vietnam_Pro'] font-bold text-[14px]">
              Isi Artikel <span class="text-red-500">*</span>
            </label>
            <span class="text-xs text-gray-500 font-['Be_Vietnam_Pro']">{{ kontenCharCount }}/{{ KONTEN_MAX_CHARS }}</span>
          </div>
          <div class="w-full relative border border-[#d9d9d9] bg-white rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
            <!-- Rich Editor Toolbar -->
            <div class="border-b border-gray-200 p-3 flex flex-wrap gap-2 bg-gray-50">
              <!-- Text Formatting -->
              <div class="flex gap-1 border-r border-gray-300 pr-2">
                <button
                  type="button"
                  class="p-2 text-gray-600 hover:bg-gray-200 rounded font-bold text-sm"
                  title="Bold (select text then click)"
                  @click="formatText('<b>', '</b>')"
                >
                  B
                </button>
                <button
                  type="button"
                  class="p-2 text-gray-600 hover:bg-gray-200 rounded italic text-sm"
                  title="Italic (select text then click)"
                  @click="formatText('<i>', '</i>')"
                >
                  I
                </button>
                <button
                  type="button"
                  class="p-2 text-gray-600 hover:bg-gray-200 rounded underline text-sm"
                  title="Underline (select text then click)"
                  @click="formatText('<u>', '</u>')"
                >
                  U
                </button>
              </div>

              <!-- Lists -->
              <div class="flex gap-1 border-r border-gray-300 pr-2">
                  <button
                    type="button"
                    class="p-2 text-gray-600 hover:bg-gray-200 rounded text-sm"
                    :class="isList ? 'bg-blue-100' : ''"
                    title="Bullet List"
                    @click="toggleList"
                  >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="5" cy="6" r="1.5"></circle>
                    <circle cx="5" cy="12" r="1.5"></circle>
                    <circle cx="5" cy="18" r="1.5"></circle>
                    <line x1="10" y1="6" x2="20" y2="6"></line>
                    <line x1="10" y1="12" x2="20" y2="12"></line>
                    <line x1="10" y1="18" x2="20" y2="18"></line>
                  </svg>
                </button>
              </div>

              <!-- Clear Formatting -->
              <button
                type="button"
                class="p-2 text-gray-600 hover:bg-gray-200 rounded text-xs"
                title="Clear all text"
                @click="formData.konten = ''"
              >
                ✕ Clear
              </button>
            </div>

            <!-- Textarea Editor -->
            <textarea
              ref="kontenEditorRef"
              v-model="formData.konten"
              class="w-full min-h-[300px] p-4 font-['Be_Vietnam_Pro'] text-[16px] text-gray-800 focus:outline-none resize-y placeholder:text-neutral-300"
              placeholder="Tuliskan isi paragraf artikel di sini..."
              :maxlength="KONTEN_MAX_CHARS"
            ></textarea>
          </div>

          <!-- Live Preview -->
          <div class="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
            <p class="text-xs font-bold text-gray-600 mb-3 font-['Be_Vietnam_Pro']">Preview:</p>
            <div class="prose prose-sm max-w-full bg-white p-4 rounded border border-gray-200 font-['Be_Vietnam_Pro'] text-[14px] text-gray-800 leading-relaxed break-words"
              v-html="formData.konten.replace(/\n/g, '<br>').replace(/• /g, '• ').replace(/1\. /g, '1. ')">
            </div>
          </div>

          <span v-if="!isKontenValid && kontenCharCount > 0" class="text-xs text-red-500 font-['Be_Vietnam_Pro']">
            {{ kontenCharCount < KONTEN_MIN_CHARS ? `Isi artikel minimal ${KONTEN_MIN_CHARS} karakter` : `Isi artikel maksimal ${KONTEN_MAX_CHARS} karakter` }}
          </span>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-between items-center sm:h-12">
          <SButton
            :label="isEditMode ? 'Simpan Perubahan' : 'Simpan Sebagai Draft'"
            variant="ghost"
            :disabled="isSubmitting || !isJudulValid || !isKontenValid"
            @click="submitArticle('draft')"
            class="w-full sm:w-1/2"
          />

          <SButton
            variant="primary"
            :disabled="isSubmitting || !isFormValid"
            @click="submitArticle('published')"
            class="w-full sm:w-1/2"
          >
            <template #left-icon>
              <svg v-if="!isEditMode" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </template>
            {{ isEditMode ? 'Perbarui Artikel' : 'Unggah Artikel' }}
          </SButton>
        </div>

        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.artikel-page {
  min-height: calc(100vh - 64px);
  background: var(--color-general-frame, #f5f5f5);
  padding: 24px 16px;
}

.artikel-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.artikel-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
