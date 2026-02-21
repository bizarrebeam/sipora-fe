<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  variant?: 'outline' | 'outline-filled' | 'solid' | 'light'
  size?: 'small' | 'medium' | 'large'
}>(), {
  variant: 'outline',
  size: 'large'
})

const baseClasses = 'inline-flex items-center justify-center rounded-full cursor-pointer transition-all duration-200'

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'px-2 py-1 gap-0.5 subheading-s9'
    case 'medium':
      return 'px-3 py-2 gap-1 subheading-s8'
    case 'large':
    default:
      return 'px-4 py-2 gap-2 subheading-s7'
  }
})

const iconSizeClasses = computed(() => {
  return props.size === 'small' ? 'size-2.5' : 'size-4'
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'outline-filled':
      return 'border border-blue-500 bg-blue-50 text-blue-500 hover:bg-blue-100'
    case 'solid':
      return 'border border-transparent bg-blue-500 text-white hover:bg-blue-600'
    case 'light':
      return 'border border-transparent bg-blue-50 text-blue-600 hover:bg-blue-100'
    case 'outline':
    default:
      return 'border border-blue-500 bg-transparent text-blue-500 hover:bg-blue-50'
  }
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
