<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  variant?: 'solid' | 'light'
  size?: 'small' | 'medium' | 'large'
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}>(), {
  variant: 'solid',
  size: 'large',
  tone: 'default'
})

const baseClasses = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 font-semibold'

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'px-2 py-0.5 gap-0.5 text-[11px]'
    case 'medium':
      return 'px-3 py-1 gap-1 text-[13px]'
    case 'large':
    default:
      return 'px-3.5 py-1.5 gap-2 text-[13px]'
  }
})

const iconSizeClasses = computed(() => {
  return props.size === 'small' ? 'size-2.5' : 'size-4'
})

const variantClasses = computed(() => {
  const tones: Record<string, string> = {
    default: 'bg-blue-50 border border-[#2E3094] border-opacity-50 text-[#2E3094] hover:bg-blue-100', // diproses
    success: 'bg-[#E8F5E9] border border-[#2E7D32] text-[#2E7D32] hover:bg-[#c8e6c9]', // selesai
    warning: 'bg-[#FFF8E1] border border-[#F59E0B] text-[#F59E0B] hover:bg-[#ffecb3]', // menunggu
    danger: 'bg-[#FEF2F2] border border-[#DC2626] text-[#DC2626] hover:bg-[#fecaca]', // ditolak/dibatalkan
    info: 'bg-[#EAEAF4] border border-[#2E3094] text-[#2E3094] hover:bg-[#d0d0f0]', // diproses
    neutral: 'bg-neutral-50 border border-neutral-400 text-neutral-700 hover:bg-neutral-100'
  }

  const lights: Record<string, string> = {
    default: 'bg-blue-50 text-[#2E3094] hover:bg-blue-100',
    success: 'bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#c8e6c9]',
    warning: 'bg-[#FFF8E1] text-[#F59E0B] hover:bg-[#ffecb3]',
    danger: 'bg-[#FEF2F2] text-[#DC2626] hover:bg-[#fecaca]',
    info: 'bg-[#EAEAF4] text-[#2E3094] hover:bg-[#d0d0f0]',
    neutral: 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
  }

  if (props.variant === 'light') {
    return lights[props.tone || 'default']
  }
  
  return tones[props.tone || 'default']
})
</script>

<template>
  <span :class="[baseClasses, sizeClasses, variantClasses]">
    <span
      v-if="$slots.icon"
      class="flex shrink-0 items-center justify-center *:size-full"
      :class="iconSizeClasses"
    >
      <slot name="icon" />
    </span>
    <span>{{ label }}</span>
  </span>
</template>
