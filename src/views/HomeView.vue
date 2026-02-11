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
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h1 class="text-2xl font-bold text-gray-800 mb-4">SIPORA</h1>
      <p class="text-gray-600 mb-6">Sistem Pelaporan Pengaduan</p>
      
      <div class="border-t pt-4">
        <p class="text-sm text-gray-500 mb-2">Backend Status:</p>
        <div v-if="isLoading" class="text-gray-400">
          Connecting...
        </div>
        <div v-else-if="isConnected" class="text-green-600 font-medium">
          {{ backendStatus }}
        </div>
        <div v-else class="text-red-600 font-medium">
          {{ backendStatus }}
        </div>
      </div>
    </div>
  </div>
</template>