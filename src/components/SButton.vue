<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'tertiary' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 sm:px-5 sm:py-4 text-sm sm:text-base transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-semibold'

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-blue-50 text-blue-800 hover:bg-blue-100 active:bg-blue-200'
    case 'ghost':
      return 'bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100'
    case 'tertiary':
      return 'bg-transparent border border-transparent text-general-black hover:border-general-black active:bg-neutral-50'
    case 'danger':
      return 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
    case 'primary':
    default:
      return 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
  }
})
</script>

<template>
  <button
    :class="[baseClasses, variantClasses]"
    :type="type || 'button'"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot name="left-icon" />
    <span v-if="label">{{ label }}</span>
    <slot />
    <slot name="right-icon" />
  </button>
</template>