<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  title: { type: String, default: 'Jenis Bullying Terbanyak' },
  subtitle: { type: String, default: '' },
  items: { type: Object, default: () => ({}) }, 
  colors: { type: Array, default: () => [' var(--color-blue-600)','#6366F1','#4F46E5','#A78BFA','#7C3AED','var(--color-blue-300)' ]}
})

const labels = computed(() => Object.keys(props.items))
const series = computed(() => Object.values(props.items).map(v => Number(v || 0)))
const hasData = computed(() => series.value.some((v) => v > 0) && labels.value.length > 0)

const chartHeight = 200

const chartOptions = computed(() => ({
  chart: { type: 'donut', toolbar: { show: false } },
  labels: labels.value,
  colors: hasData.value ? props.colors : labels.value.map(() => '#E5E7EB'),
  legend: { show: false },
  dataLabels: { enabled: false },
  stroke: { show: false },
  tooltip: { y: { formatter: (val) => String(val) + ' Laporan' } },
}))
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white p-6 w-flex chart-panel">
    <div class="mb-3">
      <h3 class="text-lg font-bold text-gray-800">{{ title }}</h3>
      <p v-if="subtitle" class=" mt-1 text-sm text-gray-500 font-medium">{{ subtitle }}</p>
    </div>

    <div class="flex items-start gap-4 item-center">
      <div class="w-full flex justify-center mt-2">
        <VueApexCharts type="donut" :options="chartOptions" :series="series" :height="chartHeight" />
      </div>
    </div>
    <div class="flex-1 mt-6">
      <ul class="space-y-2">
        <li v-if="!hasData" class="text-sm text-gray-500">Belum ada data</li>
        <li v-else v-for="(label, idx) in labels" :key="label" class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span :style="{ background: props.colors[idx % props.colors.length] }" class="w-3 h-3 rounded-full inline-block"></span>
            <span class="text-sm text-gray-700 capitalize">{{ label }}</span>
          </div>
          <div class="text-sm text-gray-800 font-semibold">{{ series[idx] }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.chart-panel { min-height: 320px; }
</style>



