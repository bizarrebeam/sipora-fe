<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label?: string
  required?: boolean
  placeholder?: string
  modelValue?: string | number | null
  name?: string
  variant?: 'dropdown' | 'text' | 'textarea'
  disabled?: boolean
  inputType?: 'text' | 'password' | 'email' | 'number'
  showIcon?: boolean
  maxlength?: string | number
  digitGuide?: string | number // "4" for NIS, "16" for NUPTK
  digitGroup?: string | number // "4"
  autocomplete?: string
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

const maskedInputStyle = computed(() => {
  if (!props.digitGuide) return {}
  
  const total = Number(props.digitGuide)
  const group = Number(props.digitGroup) || total
  
  const charWidth = 1.6
  const gapWidth = 0.6
  const groupGap = 2.4
  
  let stops = []
  let currentPos = 0
  
  for (let i = 0; i < total; i++) {
    stops.push(`var(--color-general-border) ${currentPos}ch`)
    currentPos += charWidth
    stops.push(`var(--color-general-border) ${currentPos}ch`)
    stops.push(`transparent ${currentPos}ch`)
    
    if (group && (i + 1) % group === 0 && i !== total - 1) {
      currentPos += groupGap
    } else {
      currentPos += gapWidth
    }
    stops.push(`transparent ${currentPos}ch`)
  }
  
  return {
    '--total-width': `${currentPos}ch`,
    'letter-spacing': `${gapWidth}ch`,
    'background-image': `linear-gradient(to right, ${stops.join(', ')})`,
  }
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
      :name="name"
      :disabled="disabled"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @blur="$emit('blur')"
    ></textarea>

    <!-- Text variant -->
    <div v-else class="relative w-full">
      <div 
        v-if="digitGuide" 
        class="masked-input-container rounded-lg border border-general-border bg-white transition-colors hover:border-blue-500"
        :class="{ 
          'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15': !disabled,
          'opacity-50 cursor-not-allowed': disabled
        }"
      >
        <!-- Actual hidden input -->
        <input
          :type="inputType || 'text'"
          class="masked-input-hidden"
          :value="modelValue"
          :name="name"
          :disabled="disabled"
          :maxlength="maxlength"
          :autocomplete="autocomplete"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @blur="$emit('blur')"
        />
        
        <!-- Visual slots layer -->
        <div class="masked-slots-layer" aria-hidden="true">
          <template v-for="(slot, index) in Number(digitGuide)" :key="index">
            <div 
              class="masked-slot"
              :class="{ 
                'group-gap': digitGroup && (index + 1) % Number(digitGroup) === 0 && (index + 1) !== Number(digitGuide)
              }"
            >
              <span class="digit-char">{{ String(modelValue || '')[index] || '' }}</span>
              <div 
                class="digit-underline"
                :class="{ 'filled': String(modelValue || '').length > index }"
              ></div>
            </div>
          </template>
        </div>
      </div>

      <template v-else>
        <input
          :type="inputType || 'text'"
          class="flex w-full items-center rounded-lg border border-general-border bg-white px-3 py-2.5 sm:px-4 sm:py-3 text-general-black text-sm sm:text-base font-['Be_Vietnam_Pro'] font-medium placeholder:text-neutral-300 transition-colors hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          :class="{ 'pr-10': iconVisible }"
          :placeholder="placeholder || 'Ketik di sini...'"
          :value="modelValue"
          :name="name"
          :disabled="disabled"
          :maxlength="maxlength"
          :autocomplete="autocomplete"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @blur="$emit('blur')"
        />
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
      </template>
    </div>
  </div>
</template>

<style scoped>
.masked-input-container {
  position: relative;
  width: 100%;
  display: flex;
  padding: 10px 16px;
  min-height: 52px;
  align-items: center;
}

.masked-input-hidden {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  z-index: 10;
  cursor: text;
}

.masked-slots-layer {
  display: flex;
  align-items: flex-end;
  gap: 0.5ch;
  pointer-events: none;
  width: 100%;
}

.masked-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 1.6ch;
}

.masked-slot.group-gap {
  margin-right: 1.4ch;
}

.digit-char {
  font-family: 'Space Grotesk', monospace;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-general-black);
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.digit-underline {
  width: 100%;
  height: 2px;
  background-color: var(--color-general-border);
  margin-top: 4px;
  transition: background-color 0.2s ease;
}

.digit-underline.filled {
  background-color: var(--color-blue-500);
}

.masked-input-container:focus-within .digit-underline:not(.filled) {
  /* background-color: var(--color-blue-200); */
}

/* Adjust for small screens */
@media (max-width: 480px) {
  .masked-input-container {
    padding: 8px 12px;
    min-height: 44px;
  }
  .digit-char {
    font-size: 16px;
    height: 20px;
  }
}
</style>
