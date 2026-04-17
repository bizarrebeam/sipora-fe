<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: string | number
  difference?: number 
  icon?: string
  filter?: string
  variant?: string
}>()

const variantClass = computed(() => `stat-card--${props.variant || 'total'}`)

</script>

<template>
  <div :class="[variantClass, 'relative rounded-2xl border border-gray-200 bg-white p-5 md:p-6 flex flex-col justify-between']">
    <div class="absolute top-5 right-5 w-3 h-3 rounded-full indicator-dot"></div>
    <div>
      <span class="text-lg text-blue-600 font-bold">{{ title }}</span>
      <h4 class="mt-2 text-2xl font-bold stat-number"> {{ value }} </h4>
    </div>
    <div v-if="difference !== undefined" class="mt-4 flex justify-start items-center">
      <span
        :class="[ 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
          difference > 0 ? 'bg-green-100 text-green-700' : 
          difference < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600']">
         {{ difference > 0 ? '+' : '' }}{{ difference }}
      </span>
      <span class="ml-2 text-xs text-gray-500 font-medium"> dari {{ filter }} lalu </span>
    </div>
  </div>
</template>

<style scoped>
.stat-card--menunggu .indicator-dot { background: #F59E0B; }
.stat-card--diproses .indicator-dot { background: var(--color-blue-200); }
.stat-card--selesai .indicator-dot { background: #2E7D32; }
.stat-card--total .indicator-dot { background: var(--color-blue-600); }
</style>