<script setup lang="ts">
import SNavbar from '@/components/SNavbar.vue'
import SSidebar from '@/components/SSidebar.vue'
import SFooter from '@/components/SFooter.vue'
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

onMounted(async () => {
  try {
    await getApiStatus()
    if (authStore.isAuthenticated) {
      try {
        await authStore.fetchProfile()
      } catch (err: any) {
    if (err?.name === 'ServerHandledError') {
      console.error('[App] Request failed (handled globally):', err.message);
      return;
    }
        if (err.message?.includes('401') || err.message?.includes('Sesi')) {
          authStore.clearLocalSession()
        }
      }
    }
  } catch {
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
      <SFooter v-if="!isAdmin || isGuestRoute" />
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
  padding-left: 260px; 
  width: 100%;
  min-height: 100vh;
  background: var(--color-general-frame);
}

@media (max-width: 1024px) {
  .admin-main {
    padding-left: 0;
    padding-top: 64px; 
  }
}

body {
  margin: 0;
  padding: 0;
  overflow-y: auto; 
}

</style>
```