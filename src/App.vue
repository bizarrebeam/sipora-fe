<script setup lang="ts">
import { RouterView } from 'vue-router'
import SNavbar from '@/components/SNavbar.vue'
import SLoading from '@/components/SLoading.vue'
</script>

<template>
  <SNavbar />
  <RouterView />
  <SLoading />
</template>