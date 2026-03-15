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
      return 'px-4 py-2 gap-2 text-[14px]'
  }
})

const iconSizeClasses = computed(() => {
  return props.size === 'small' ? 'size-2.5' : 'size-4'
})

const variantClasses = computed(() => {
  const tones: Record<string, string> = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    info: 'bg-blue-400 text-white hover:bg-blue-500',
    neutral: 'bg-neutral-600 text-white hover:bg-neutral-700'
  }

  const lights: Record<string, string> = {
    default: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    success: 'bg-green-50 text-green-700 hover:bg-green-100',
    warning: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
    info: 'bg-blue-50 text-blue-500 hover:bg-blue-100',
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
