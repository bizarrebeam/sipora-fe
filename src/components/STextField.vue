<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label?: string
  required?: boolean
  placeholder?: string
  modelValue?: string | number | null
  variant?: 'dropdown' | 'text' | 'textarea'
  disabled?: boolean
  inputType?: 'text' | 'password' | 'email' | 'number'
  showIcon?: boolean
  maxlength?: string | number
  digitGuide?: string | number // e.g. "16" for NUPTK
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'click'): void
  (e: 'blur'): void
}>()

const iconVisible = computed(() => {
  if (props.showIcon !== undefined) return props.showIcon
  return props.variant === 'dropdown'
})
</script>

<template>
  <div class="flex w-full flex-col items-start gap-2">
    <!-- Label row -->
    <div v-if="label" class="flex items-start gap-1">
      <label class="text-general-black subheading-s7">{{ label }}</label>
      <span v-if="required" class="text-general-red font-['Space_Grotesk'] font-bold text-xs leading-4">*</span>
    </div>

    <!-- Dropdown variant -->
    <button
      v-if="variant === 'dropdown'"
      type="button"
      class="flex w-full items-center justify-between rounded-lg border border-general-border bg-white px-3 py-2.5 sm:px-4 sm:py-3 transition-colors hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base"
      :disabled="disabled"
      @click="$emit('click')"
      @blur="$emit('blur')"
    >
      <span
        class="flex-1 text-left font-['Be_Vietnam_Pro'] font-medium"
        :class="modelValue ? 'text-general-black' : 'text-neutral-300'"
      >
        {{ modelValue || placeholder || 'Ketik di sini...' }}
      </span>
      <slot name="icon">
        <svg
          v-if="iconVisible"
          class="size-5 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="#333333"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </slot>
    </button>

    <!-- Textarea variant -->
    <textarea
      v-else-if="variant === 'textarea'"
      class="flex w-full min-h-[113px] items-start rounded-lg border border-general-border bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-general-black text-sm sm:text-base font-['Be_Vietnam_Pro'] font-medium placeholder:text-neutral-300 transition-colors hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
      :placeholder="placeholder || 'Ketik di sini...'"
      :value="modelValue"
      :disabled="disabled"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @blur="$emit('blur')"
    ></textarea>

    <!-- Text variant -->
    <div v-else class="relative w-full">
      <input
        :type="inputType || 'text'"
        class="flex w-full items-center rounded-lg border border-general-border bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-general-black text-sm sm:text-base font-['Be_Vietnam_Pro'] font-medium placeholder:text-neutral-300 transition-colors hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        :class="{ 'pr-10': iconVisible, 'tracking-[0.2em] font-mono': digitGuide }"
        :placeholder="placeholder || 'Ketik di sini...'"
        :value="modelValue"
        :disabled="disabled"
        :maxlength="maxlength"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur')"
      />
      <!-- Visual digit guide -->
      <div v-if="digitGuide" class="flex gap-1 mt-1.5 px-1 overflow-hidden pointer-events-none">
        <div 
          v-for="i in Number(digitGuide)" 
          :key="i"
          class="h-1 flex-1 rounded-full transition-colors"
          :class="String(modelValue || '').length >= i ? 'bg-blue-500' : 'bg-neutral-200'"
        ></div>
      </div>
      <div v-if="iconVisible" class="pointer-events-none absolute inset-y-0 right-4 flex items-center">
        <slot name="icon">
          <svg
            class="size-5 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="#333333"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </slot>
      </div>
    </div>
  </div>
</template>
