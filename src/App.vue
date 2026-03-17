<script setup lang="ts">
import SNavbar from '@/components/SNavbar.vue'
import SLoading from '@/components/SLoading.vue'
import SDialog from '@/components/SDialog.vue'
import { Toaster } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
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

  <SLoading />
  <Toaster position="top-right" :duration="3000" rich-colors />
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