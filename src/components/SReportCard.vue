<script setup lang="ts">
import SChip from '@/components/SChip.vue'
import SButton from '@/components/SButton.vue'

defineProps<{
  status?: string
  chipLabel?: string
  chipTone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default'
  date: string
  title: string
  location?: string
  reportNumber: string
}>()

defineEmits<{
  (e: 'clickCard'): void
  (e: 'clickDetail'): void
}>()

function statusLabel(status: string) {
  const map: Record<string, string> = {
    menunggu: 'Menunggu Konfirmasi',
    diproses: 'Diproses',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
    dibatalkan: 'Dibatalkan',
  }
  return map[status] || status
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default' {
  if (status === 'selesai') return 'success'
  if (status === 'diproses') return 'info'
  if (status === 'menunggu') return 'warning'
  return 'danger'
}
</script>

<template>
  <div class="report-card" @click="$emit('clickCard')">
    <div class="report-card__top">
      <SChip 
        v-if="chipLabel"
        :label="chipLabel" 
        :tone="chipTone || 'info'" 
        size="small" 
      />
      <SChip 
        v-else-if="status"
        :label="statusLabel(status)" 
        :tone="statusTone(status)" 
        size="small" 
      />
      <span class="report-card__date">{{ date }}</span>
    </div>

    <h4 class="report-card__no">{{ title }}</h4>

    <div class="report-card__info">
      <div v-if="location" class="report-card__info-row">
        <svg xmlns="http://www.w3.org/2000/svg" class="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{{ location }}</span>
      </div>
      <div class="report-card__info-row">
        <svg xmlns="http://www.w3.org/2000/svg" class="info-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8M8 11h6M8 15h8M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        </svg>
        <span>{{ reportNumber }}</span>
      </div>
    </div>

    <div class="report-card__footer">
      <SButton 
        label="Detail" 
        variant="action" 
        size="small" 
        class="w-full"
        @click.stop="$emit('clickDetail')" 
      />
    </div>
  </div>
</template>

<style scoped>
.report-card {
  background: white;
  border: 1px solid var(--color-general-border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.report-card:hover {
  border-color: var(--color-blue-300);
  box-shadow: 0 4px 16px rgba(46, 48, 148, 0.08);
  transform: translateY(-2px);
}

.report-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.report-card__date {
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: var(--color-neutral-400);
}

.report-card__no {
  font-family: var(--font-be-vietnam);
  font-weight: 700;
  font-size: 16px;
  color: var(--color-general-black);
  margin: 0;
  line-height: 1.4;
}

.report-card__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-card__info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Be Vietnam Pro", sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: var(--color-neutral-500);
}

.info-icon {
  width: 16px;
  height: 16px;
  color: var(--color-neutral-400);
}

.report-card__footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--color-general-border);
}
</style>
