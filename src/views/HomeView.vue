<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getApiStatus } from '@/services/api'

const backendStatus = ref('')
const isConnected = ref(false)
const isLoading = ref(true)

onMounted(async () => {
  try {
    const response = await getApiStatus()
    backendStatus.value = response.message
    isConnected.value = true
  } catch (error) {
    backendStatus.value = 'Failed to connect to backend'
    isConnected.value = false
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-general-frame flex items-center justify-center">
    <div class="bg-general-white p-10 rounded-2xl shadow-lg max-w-md w-full border border-general-border">
      <!-- Title -->
      <h1 class="heading-h4 text-blue-500 mb-2">SIPORA</h1>
      <p class="subheading-s6 text-neutral-600 mb-8">Sistem Pelaporan Pengaduan</p>

      <!-- Backend Status Card -->
      <div class="border-t border-general-border pt-6">
        <p class="body-b8 text-neutral-500 mb-3 uppercase tracking-wider">Backend Status</p>

        <!-- Loading -->
        <div v-if="isLoading" class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-neutral-300 animate-pulse"></div>
          <span class="body-b7 text-neutral-400">Connecting...</span>
        </div>

        <!-- Connected -->
        <div v-else-if="isConnected" class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span class="body-b7 text-general-black">{{ backendStatus }}</span>
        </div>

        <!-- Failed -->
        <div v-else class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <span class="body-b7 text-red-600">{{ backendStatus }}</span>
        </div>
      </div>

      <!-- Design System Preview -->
      <div class="mt-8 border-t border-general-border pt-6">
        <p class="body-b8 text-neutral-500 mb-3 uppercase tracking-wider">Design System Preview</p>

        <!-- Color Swatches -->
        <div class="flex gap-1 mb-4">
          <div class="w-6 h-6 rounded bg-blue-50" title="blue-50"></div>
          <div class="w-6 h-6 rounded bg-blue-100" title="blue-100"></div>
          <div class="w-6 h-6 rounded bg-blue-200" title="blue-200"></div>
          <div class="w-6 h-6 rounded bg-blue-300" title="blue-300"></div>
          <div class="w-6 h-6 rounded bg-blue-400" title="blue-400"></div>
          <div class="w-6 h-6 rounded bg-blue-500" title="blue-500"></div>
          <div class="w-6 h-6 rounded bg-blue-600" title="blue-600"></div>
          <div class="w-6 h-6 rounded bg-blue-700" title="blue-700"></div>
          <div class="w-6 h-6 rounded bg-blue-800" title="blue-800"></div>
          <div class="w-6 h-6 rounded bg-blue-900" title="blue-900"></div>
        </div>

        <div class="flex gap-1 mb-4">
          <div class="w-6 h-6 rounded bg-neutral-50 border border-general-border" title="neutral-50"></div>
          <div class="w-6 h-6 rounded bg-neutral-100" title="neutral-100"></div>
          <div class="w-6 h-6 rounded bg-neutral-200" title="neutral-200"></div>
          <div class="w-6 h-6 rounded bg-neutral-300" title="neutral-300"></div>
          <div class="w-6 h-6 rounded bg-neutral-400" title="neutral-400"></div>
          <div class="w-6 h-6 rounded bg-neutral-500" title="neutral-500"></div>
          <div class="w-6 h-6 rounded bg-neutral-600" title="neutral-600"></div>
          <div class="w-6 h-6 rounded bg-neutral-700" title="neutral-700"></div>
          <div class="w-6 h-6 rounded bg-neutral-800" title="neutral-800"></div>
          <div class="w-6 h-6 rounded bg-neutral-900" title="neutral-900"></div>
        </div>

        <!-- Typography Samples -->
        <div class="space-y-1">
          <p class="heading-h6 text-general-black">Heading H6</p>
          <p class="subheading-s7 text-general-black">Sub-heading S7</p>
          <p class="body-b7 text-general-black">Body B7 — Plus Jakarta Sans</p>
        </div>
      </div>
    </div>
  </div>
</template>