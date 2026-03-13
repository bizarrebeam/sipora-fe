<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  label?: string
  required?: boolean
  placeholder?: string
  modelValue?: string | number | null
  options: { label: string; value: string | number }[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const selectedLabel = computed(() => {
  const selected = props.options.find(opt => opt.value === props.modelValue)
  return selected ? selected.label : ''
})

const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

const selectOption = (value: string | number) => {
  emit('update:modelValue', value)
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="flex w-full flex-col items-start gap-2" ref="dropdownRef">
    <div v-if="label" class="flex items-start gap-1">
      <label class="text-general-black subheading-s7">{{ label }}</label>
      <span v-if="required" class="text-general-red font-['Space_Grotesk'] font-bold text-xs leading-4">*</span>
    </div>

    <div class="relative w-full">
      <button
        type="button"
        class="flex w-full items-center justify-between rounded-lg border border-general-border bg-white px-3 py-2.5 sm:px-4 sm:py-3 transition-colors hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50 text-sm sm:text-base"
        :disabled="disabled"
        @click="toggleDropdown"
      >
        <span
          class="flex-1 text-left font-['Be_Vietnam_Pro'] font-medium"
          :class="selectedLabel ? 'text-general-black' : 'text-neutral-300'"
        >
          {{ selectedLabel || placeholder || 'Pilih di sini...' }}
        </span>
        
        <svg
          class="size-5 shrink-0 transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
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
      </button>

      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <ul
          v-if="isOpen"
          class="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-general-border bg-white py-1 text-sm sm:text-base shadow-lg focus:outline-none font-['Be_Vietnam_Pro']"
        >
          <li
            v-for="option in options"
            :key="option.value"
            class="relative cursor-pointer select-none py-2.5 pl-4 pr-4 hover:bg-blue-50 transition-colors"
            :class="{ 'bg-blue-50/50 text-blue-600': modelValue === option.value, 'text-general-black': modelValue !== option.value }"
            @click="selectOption(option.value)"
          >
            <span class="block truncate font-medium">
              {{ option.label }}
            </span>
          </li>
        </ul>
      </Transition>
    </div>
  </div>
</template>