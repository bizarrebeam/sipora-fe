<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  title: {
    type: String,
    default: 'Total Laporan Bullying',
  },
  filterName: {
    type: String,
    default: '',
  },
  series: {
    type: Array,
    required: true,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  colors: {
    type: Array,
    default: () =>  ['var(--color-blue-500)'], 
  }
})

const chartHeight = 320

const chartOptions = computed(() => {
  const rawCategories = Array.isArray(props.categories) ? props.categories : []
  const filter = (props.filterName || '').toLowerCase()
  let categories = rawCategories.map((c) => String(c))

  if (filter.includes('bulan') || filter.includes('month')) {
    categories = categories.map((label) => {
      const m = label.match(/(\d{1,2})/) 
      return m ? m[1] : label
    })
  }

  let maxVal = 0
  if (Array.isArray(props.series)) {
    for (const s of props.series) {
      const dataArr = Array.isArray(s && s.data) ? s.data : (Array.isArray(s) ? s : [])
      for (const v of dataArr) {
        const n = Number(v) || 0
        if (n > maxVal) maxVal = n
      }
    }
  }

  const minTicks = 3
  if (maxVal <= 0) {
    return {
      colors: props.colors,
      chart: { fontFamily: '"Be Vietnam Pro", sans-serif', type: 'bar', toolbar: { show: false } },
      plotOptions: { bar: { horizontal: false, columnWidth: '35%', borderRadius: 4, borderRadiusApplication: 'end' } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { rotate: -45, hideOverlappingLabels: true, style: { colors: '#6B7280', fontSize: '12px' } } },
      legend: { show: false },
      yaxis: { min: 0, max: minTicks, tickAmount: minTicks, labels: { formatter: (val) => Math.round(val).toString(), style: { colors: '#6B7280', fontSize: '12px' } } },
      grid: { borderColor: '#E5E7EB', strokeDashArray: 4, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
      fill: { opacity: 1 },
      tooltip: { y: { formatter: (val) => String(val) + ' Laporan' } },
    }
  }

  let step = Math.ceil(maxVal / minTicks)
  if (step < 1) step = 1

  const magnitude = Math.pow(10, Math.floor(Math.log10(step)))
  const normalized = Math.ceil(step / magnitude)
  let niceStep
  if (normalized <= 1) niceStep = 1 * magnitude
  else if (normalized <= 2) niceStep = 2 * magnitude
  else if (normalized <= 5) niceStep = 5 * magnitude
  else niceStep = 10 * magnitude

  let tickCount = Math.ceil(maxVal / niceStep)
  if (tickCount < minTicks) tickCount = minTicks
  const yMax = niceStep * tickCount

  return {
    colors: props.colors,
    chart: { fontFamily: '"Be Vietnam Pro", sans-serif', type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: '35%', borderRadius: 4, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: { categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { rotate: -45, hideOverlappingLabels: true, style: { colors: '#6B7280', fontSize: '12px' } } },
    legend: { show: false },
    yaxis: {
      min: 0,
      max: yMax,
      tickAmount: tickCount,
      labels: {
        formatter: (val) => Math.round(val).toString(), 
        style: { colors: '#6B7280', fontSize: '12px' },
      },
    },
    grid: { borderColor: '#E5E7EB', strokeDashArray: 4, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    fill: { opacity: 1 },
    tooltip: { y: { formatter: (val) => String(Math.round(val)) + ' Laporan' } },
  }
})
</script>

<template>
  <div class="mt-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
    
    <div class="mb-6">
      <h3 class="text-lg font-bold text-gray-800">
        {{ title }}
      </h3>
      <p class="mt-1 text-sm text-gray-500 font-medium">
        Pada {{ filterName }} ini
      </p>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <div id="chartOne" class="min-w-[600px] xl:min-w-full chart-panel">
        <VueApexCharts type="bar" :height="chartHeight" :options="chartOptions" :series="series" />
      </div>
    </div>
    
  </div>
</template>

<style scoped>
.chart-panel { min-height: 320px; }
</style>