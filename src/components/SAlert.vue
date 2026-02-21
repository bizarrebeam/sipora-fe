<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'default' | 'warning' | 'no-header'
  title?: string
  description: string
  primaryButtonText?: string
  secondaryButtonText?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'primaryClick'): void
  (e: 'secondaryClick'): void
}>()

const headerClass = computed(() => {
  if (props.type === 'warning') return 'bg-red-50 text-general-red flex items-center justify-center p-7 relative'
  return 'bg-blue-50 text-blue-500 flex items-center justify-center p-7 relative'
})

const showHeader = computed(() => props.type !== 'no-header')
</script>

<template>
  <div class="flex w-[572px] flex-col overflow-hidden rounded-2xl border border-general-border bg-white shadow-[0px_0px_10px_0px_rgba(159,160,206,0.5)]">
    <!-- Header -->
    <div v-if="showHeader" :class="headerClass">
      <h3 class="w-full text-center heading-h5">{{ title }}</h3>
      <button 
        type="button" 
        class="absolute right-[21px] top-[21px] flex size-6 items-center justify-center text-general-black hover:opacity-70 transition-opacity"
        @click="$emit('close')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    
    <!-- No Header Close Button -->
    <button 
      v-else
      type="button" 
      class="absolute right-6 top-6 flex size-6 items-center justify-center text-general-black hover:opacity-70 transition-opacity"
      @click="$emit('close')"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Body -->
    <div class="flex flex-col items-center justify-center gap-6 p-8" :class="{ 'pt-14': !showHeader }">
      <p class="w-[508px] text-center text-general-black subheading-s6 whitespace-pre-wrap">{{ description }}</p>
      
      <!-- Actions -->
      <div class="flex w-full items-center justify-center gap-[29px]">
        <button
          v-if="secondaryButtonText"
          type="button"
          class="flex flex-1 items-center justify-center rounded-lg px-5 py-4 transition-colors subheading-s7"
          :class="type === 'warning' ? 'border border-general-black text-general-black hover:bg-neutral-50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'"
          @click="$emit('secondaryClick')"
        >
          {{ secondaryButtonText }}
        </button>
        <button
          v-if="primaryButtonText"
          type="button"
          class="flex flex-1 items-center justify-center rounded-lg px-5 py-4 text-white transition-colors subheading-s7"
          :class="type === 'warning' ? 'bg-general-red hover:bg-red-400' : 'bg-blue-500 hover:bg-blue-600'"
          @click="$emit('primaryClick')"
        >
          {{ primaryButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>
