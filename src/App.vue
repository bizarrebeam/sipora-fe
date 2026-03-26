<script setup lang="ts">
import SNavbar from '@/components/SNavbar.vue'
import SLoading from '@/components/SLoading.vue'
import SDialog from '@/components/SDialog.vue'
import SAlert from '@/components/SAlert.vue'
import SNotFound from '@/components/SNotFound.vue'
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alert'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const authStore = useAuthStore()
const alertStore = useAlertStore()
const router = useRouter()
const route = useRoute()

const isGuestRoute = computed(() => route.meta.guest === true)

function handleSessionExpired() {
  authStore.setSessionExpired(false)
  router.push('/login')
}
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