<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const pages = computed(() => {
  const current = props.modelValue
  const total = props.totalPages
  const delta = 1
  const range: (number | string)[] = []
  const rangeWithDots: (number | string)[] = []
  let l: number | undefined

  range.push(1)
  for (let i = current - delta; i <= current + delta; i++) {
    if (i < total && i > 1) {
      range.push(i)
    }
  }
  if (total > 1) {
    range.push(total)
  }

  for (const i of range) {
    if (l !== undefined) {
      if (typeof i === 'number' && i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (typeof i === 'number' && i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i as number
  }

  return rangeWithDots
})

const handlePageClick = (page: number | string) => {
  if (typeof page === 'number' && page !== props.modelValue) {
    emit('update:modelValue', page)
  }
}

const prevPage = () => {
  if (props.modelValue > 1) {
    emit('update:modelValue', props.modelValue - 1)
  }
}

const nextPage = () => {
  if (props.modelValue < props.totalPages) {
    emit('update:modelValue', props.modelValue + 1)
  }
}
</script>

<template>
  <nav aria-label="Pagination" class="flex items-center gap-2">
    <!-- Prev button -->
    <button
      type="button"
      class="flex size-8 items-center justify-center rounded transition-colors"
      :class="modelValue === 1 ? 'bg-neutral-500/50 cursor-not-allowed' : 'bg-white border border-general-frame hover:bg-neutral-50 cursor-pointer'"
      :disabled="modelValue === 1"
      @click="prevPage"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 9L4 6L7 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Page numbers -->
    <button
      v-for="(page, idx) in pages"
      :key="idx"
      type="button"
      class="flex size-8 items-center justify-center rounded heading-h7 transition-colors"
      :class="[
        page === modelValue
          ? 'border border-blue-500 text-blue-500 bg-white'
          : page === '...'
            ? 'border border-transparent text-general-black cursor-default'
            : 'border border-general-frame text-general-black bg-white hover:bg-neutral-50 cursor-pointer'
      ]"
      :disabled="page === '...'"
      @click="handlePageClick(page)"
    >
      {{ page }}
    </button>

    <!-- Next button -->
    <button
      type="button"
      class="flex size-8 items-center justify-center rounded transition-colors"
      :class="modelValue === totalPages ? 'bg-neutral-500/50 cursor-not-allowed' : 'bg-white border border-general-frame hover:bg-neutral-50 cursor-pointer'"
      :disabled="modelValue === totalPages"
      @click="nextPage"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 9L8 6L5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </nav>
</template>
