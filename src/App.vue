<script setup lang="ts">
import SNavbar from '@/components/SNavbar.vue'
import SLoading from '@/components/SLoading.vue'
import { Toaster } from 'vue-sonner'
</script>

<template>
  <SNavbar />
  <main class="main-layout">
    <RouterView />
  </main>
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