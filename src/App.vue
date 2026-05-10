<script setup lang="ts">
import SNavbar from '@/components/SNavbar.vue'
import SSidebar from '@/components/SSidebar.vue'
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
const isAdmin = computed(() => authStore.user?.role === 'kemahasiswaan')

function handleSessionExpired() {
  authStore.setSessionExpired(false)
  router.push('/login')
}

// Proactive health check and session verification on app initialization
onMounted(async () => {
  try {
    // 1. Basic connectivity check
    await getApiStatus()
    
    // 2. Session verification (Self-Healing)
    // If we think we are logged in, try to fetch the profile.
    // This will trigger the new Silent Refresh logic if the token is base-expired.
    if (authStore.isAuthenticated) {
      try {
        await authStore.fetchProfile()
      } catch (err: any) {
    if (err?.name === 'ServerHandledError') {
      console.error('[App] Request failed (handled globally):', err.message);
      return;
    }
        // If fetchProfile fails even after refresh attempt, 
        // we might have inconsistent state (e.g. old versions).
        if (err.message?.includes('401') || err.message?.includes('Sesi')) {
          authStore.clearLocalSession()
        }
      }
    }
  } catch {
    // Note: error object omitted, assuming could be ServerHandledError

    // Basic connectivity error is handled globally in api.ts
  }
})

</script>

<template>
  <div class="app-wrapper" :class="{ 'admin-layout': isAdmin && !isGuestRoute }">
    <SNavbar v-if="!isAdmin || isGuestRoute" />
    <SSidebar v-if="isAdmin && !isGuestRoute" />
    
    <main class="main-layout" :class="{ 'admin-main': isAdmin && !isGuestRoute }">
      <router-view v-slot="{ Component, route }">
        <keep-alive>
          <component :is="Component" :key="route.name" v-if="route.meta.keepAlive" />
        </keep-alive>
        <component :is="Component" :key="route.name" v-if="!route.meta.keepAlive" />
      </router-view>
    </main>
  </div>

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
  transition: all 0.3s ease;
}

.admin-layout {
  display: flex;
}

.admin-main {
  padding-top: 0;
  padding-left: 260px; /* Width of the sidebar */
  width: 100%;
  min-height: 100vh;
  background: var(--color-general-frame);
}

@media (max-width: 1024px) {
  .admin-main {
    padding-left: 0;
    padding-top: 64px; /* Back to top navbar space */
  }
}

body {
  margin: 0;
  padding: 0;
  overflow-y: auto; 
}

</style>
```