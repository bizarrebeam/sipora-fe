<script setup lang="ts">
import SNavbar from '@/components/SNavbar.vue'
import SLoading from '@/components/SLoading.vue'
import SDialog from '@/components/SDialog.vue'
import SAlert from '@/components/SAlert.vue'
import { useAuthStore } from '@/stores/auth'
import { useAlertStore } from '@/stores/alert'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const alertStore = useAlertStore()
const router = useRouter()

function handleSessionExpired() {
  authStore.setSessionExpired(false)
  router.push('/login')
}
</script>

<template>
  <SNavbar />
  <main class="main-layout">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
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
  display: flex;
  flex-direction: column;
}

body {
  margin: 0;
  padding: 0;
  overflow-y: scroll; 
}
</style>