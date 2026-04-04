<script setup lang="ts">
import SNavbar from '@/components/SNavbar.vue'
import SLoading from '@/components/SLoading.vue'
import SDialog from '@/components/SDialog.vue'
import SAlert from '@/components/SAlert.vue'
import SNotFound from '@/components/SNotFound.vue'
import SServerError from '@/components/SServerError.vue'
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alert'
import { useRouter, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { getApiStatus } from '@/services/api'

const authStore = useAuthStore()
const alertStore = useAlertStore()
const router = useRouter()
const route = useRoute()

const isGuestRoute = computed(() => route.meta.guest === true)

function handleSessionExpired() {
  authStore.setSessionExpired(false)
  router.push('/login')
}

// Proactive health check to detect if backend is down on app initialization
onMounted(async () => {
  try {
    await getApiStatus()
  } catch {
    // Error is already handled globally in api.ts (shows popup)
  }
})
</script>

<template>
  <SNavbar />
  <main class="main-layout">
    <router-view v-slot="{ Component, route }">
      <keep-alive v-if="route.meta.keepAlive">
        <component :is="Component" />
      </keep-alive>
      <component v-else :is="Component" />
    </router-view>
  </main>

  <SDialog
    :visible="authStore.isSessionExpired"
    variant="danger"
    title="Sesi Berakhir"
    message="Sesi login Anda telah berakhir. Silakan login kembali untuk melanjutkan aktivitas dalam sistem SIPORA."
    confirmLabel="Login Kembali"
    cancelLabel=""
    persistent
    @confirm="handleSessionExpired"
  />

  <!-- 404 / Unauthorized Popup -->
  <SNotFound />

  <SAlert
    v-model:visible="alertStore.visible"
    :type="alertStore.type"
    :title="alertStore.title"
    :description="alertStore.message"
    :primaryButtonText="alertStore.primaryButtonText"
    @primaryClick="alertStore.hide"
  />

  <SLoading />
  <SServerError />
</template>

<style>
.main-layout {
  min-height: calc(100vh - 64px);
  width: 100%;
  padding-top: 64px;
  display: flex;
  flex-direction: column;
}

body {
  margin: 0;
  padding: 0;
  overflow-y: auto; 
}

</style>
```