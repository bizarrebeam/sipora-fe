<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}>()

const toggle = () => {
  if (props.disabled) return
  const newValue = !props.modelValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}

const trackClass = computed(() => {
  return [
    'flex h-8 w-[86px] cursor-pointer items-center rounded-lg border border-general-border bg-white p-[2px] transition-colors',
    props.disabled ? 'cursor-not-allowed opacity-50' : '',
  ]
})

const thumbClass = computed(() => {
  return [
    'h-7 w-12 rounded-[6px] transition-all duration-200 ease-in-out',
    props.modelValue ? 'translate-x-[34px] bg-blue-700' : 'translate-x-0 bg-blue-200'
  ]
})
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    :class="trackClass"
    @click="toggle"
  >
    <div :class="thumbClass" />
  </button>
</template>
