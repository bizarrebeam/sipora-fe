<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useArtikelStore } from '@/stores/artikel'
import { toast } from 'vue-sonner'
import STextField from '@/components/STextField.vue'
import SLoading from '@/components/SLoading.vue'

const router = useRouter()
const route = useRoute()
const artikelStore = useArtikelStore()
const isLoading = ref(true)

const articleId = String(route.params.id)

const formData = ref({
  judul: '',
  konten: '',
})

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewImage = ref<string | null>(null)
const isDragging = ref(false)

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
  if (file.size > 5 * 1024 * 1024) {
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

const submitUpdate = async () => {
  if (!formData.value.judul.trim()) {
    toast.error('Judul artikel wajib diisi')
    return
  }
  if (!formData.value.konten.trim()) {
    toast.error('Isi artikel wajib diisi')
    return
  }

  isSubmitting.value = true

  try {
    const payload = new FormData()
    payload.append('judul', formData.value.judul)

    // Convert DOM strip tags back to HTML or simply submit plain text since we don't have rich text right now
    // Actually, backend expects HTML. If we edit it as plain text, we submit it as is.
    payload.append('konten', formData.value.konten)

    if (selectedFile.value) {
      payload.append('gambar', selectedFile.value)
    }

    await artikelStore.updateArtikel(articleId, payload)
    toast.success('Artikel berhasil diperbarui')
    // Router push back to the detail page or kelola
    router.push('/kelola-artikel')
  } catch (error: any) {
    toast.error(error.message || 'Gagal memperbarui artikel')
  } finally {
    isSubmitting.value = false
  }
}

const stripHtml = (html: string) => {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

onMounted(async () => {
  try {
    const data = await artikelStore.fetchDetailArtikel(articleId)
    formData.value.judul = data.judul
    // For now we strip HTML so it formats properly in our basic textarea
    // If you add a rich text editor later, you can pass true HTML.
    formData.value.konten = stripHtml(data.konten)
    if (data.gambar) {
      previewImage.value = data.gambar
    }
  } catch (error) {
    console.error(error)
    toast.error('Gagal mengambil data artikel')
    router.push('/kelola-artikel')
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f5] py-10 px-6 md:py-[60px] md:px-[80px]">

    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <SLoading />
    </div>

    <div v-else class="max-w-[996px] mx-auto w-full flex flex-col gap-6">

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
      <div class="flex flex-col gap-2 mb-4">
        <h1 class="text-[28px] font-[800] text-[#2e3094] font-['Be_Vietnam_Pro'] leading-[36px]">Menyusun Artikel</h1>
        <p class="text-[20px] font-[600] text-[#383838] font-['Be_Vietnam_Pro'] leading-[28px]">
          Masukan detail publikasi yang akan dibagikan ke portal siswa.
        </p>
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
              Masukkan gambar yang mendukung laporan anda dengan format PNG, JPEG, atau WebP (Max. 5 MB total)
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
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/png, image/jpeg, image/webp"
              @change="handleFileSelect"
            />
          </div>
        </div>

        <!-- Judul -->
        <div class="flex flex-col gap-2">
          <label class="text-[#383838] font-['Be_Vietnam_Pro'] font-bold text-[14px]">
            Judul Artikel <span class="text-red-500">*</span>
          </label>
          <STextField
            v-model="formData.judul"
            placeholder="Tuliskan judul artikel yang ringkas dan menarik..."
          />
        </div>

        <!-- Isi Artikel -->
        <div class="flex flex-col gap-2">
          <label class="text-[#383838] font-['Be_Vietnam_Pro'] font-bold text-[14px]">
            Isi Artikel <span class="text-red-500">*</span>
          </label>
          <div class="w-full relative border border-[#d9d9d9] bg-white rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
            <!-- Simulated Toolbar -->
            <div class="border-b border-gray-200 p-2 flex gap-2 justify-end bg-white">
              <button type="button" class="p-1 text-gray-400 hover:bg-gray-100 rounded">
                <span class="font-serif font-bold w-5 h-5 flex items-center justify-center">B</span>
              </button>
              <button type="button" class="p-1 text-gray-400 hover:bg-gray-100 rounded">
                <span class="font-serif italic font-bold w-5 h-5 flex items-center justify-center">I</span>
              </button>
              <button type="button" class="p-1 text-gray-400 hover:bg-gray-100 rounded">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path>
                </svg>
              </button>
            </div>
            <textarea
              v-model="formData.konten"
              class="w-full min-h-[300px] p-4 font-['Be_Vietnam_Pro'] text-[16px] text-gray-800 focus:outline-none resize-y placeholder:text-neutral-300"
              placeholder="Tuliskan isi paragraf artikel di sini..."
            ></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-between items-center sm:h-12">
          <button
            type="button"
            @click="router.push('/kelola-artikel')"
            :disabled="isSubmitting"
            class="w-full sm:w-1/2 h-12 rounded-lg border border-[#2e3094] text-[#2e3094] font-['Be_Vietnam_Pro'] font-bold text-[16px] flex items-center justify-center bg-transparent hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            Batalkan Perubahan
          </button>

          <button
            type="button"
            @click="submitUpdate"
            :disabled="isSubmitting"
            class="w-full sm:w-1/2 h-12 rounded-lg bg-[#2e3094] text-white font-['Be_Vietnam_Pro'] font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="shrink-0 text-white">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Unggah Perubahan
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
