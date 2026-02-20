<script setup lang="ts">
import SNavbar from '@/components/SNavbar.vue'
import SLoading from '@/components/SLoading.vue'
import { Toaster } from 'vue-sonner'
</script>

<template>
  <SNavbar />
  <RouterView />
  <SLoading />
  <Toaster position="top-right" :duration="3000" rich-colors />
</template>