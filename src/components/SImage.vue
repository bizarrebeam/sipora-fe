<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  src: string | null | undefined
  alt?: string
  objectFit?: 'cover' | 'contain' | 'fill'
}>()

const isLoaded = ref(false)

// Reset loaded state if src changes
watch(() => props.src, () => {
  isLoaded.value = false
})

const onImageLoad = () => {
  isLoaded.value = true
}

const formatImageUrl = (url: string | null | undefined) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('data:')) return url
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/'
  const baseUrl = API_BASE_URL.endsWith('/api/') ? API_BASE_URL.slice(0, -5) : API_BASE_URL
  return `${baseUrl}${url}`
}
</script>

<template>
  <div class="s-image-container">
    <div v-show="!isLoaded && src" class="simple-loader">
      <div class="simple-spinner"></div>
      <p>Memuat foto...</p>
    </div>
    <div v-if="!src" class="thumb-empty">
      <span class="thumb-initial">SIPORA</span>
    </div>
    <img 
      v-else
      :src="formatImageUrl(props.src)" 
      :alt="props.alt || 'Gambar'" 
      class="s-image-content" 
      :class="{ 
        'opacity-100': isLoaded, 
        'opacity-0': !isLoaded,
        'object-cover': objectFit === 'cover',
        'object-contain': objectFit === 'contain' || !objectFit
      }"
      @load="onImageLoad" 
      loading="lazy" 
    />
  </div>
</template>

<style scoped>
.s-image-container {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
    overflow: hidden;
}

.s-image-content { 
    width: 100%; 
    height: 100%;
    transition: opacity 0.4s ease-in-out;
}

.object-cover { object-fit: cover; }
.object-contain { object-fit: contain; }

/* ─── Simple Loader ─── */
.simple-loader {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 12px;
    background-color: #f9fafb;
    color: #6b7280;
    font-size: 14px;
    z-index: 10;
}

.simple-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #e5e7eb;
    border-top-color: var(--color-blue-600);
    border-radius: 50%;
    animation: simple-spin 1s linear infinite;
}

@keyframes simple-spin {
    to { transform: rotate(360deg); }
}

.opacity-0 { opacity: 0; }
.opacity-100 { opacity: 1; }

.thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f3f4fa;
}

.thumb-initial {
  font-size: 14px;
  font-weight: 800;
  color: #b3b5d1;
  font-family: "Be Vietnam Pro", sans-serif;
  letter-spacing: 1px;
}
</style>
