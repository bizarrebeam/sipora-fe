<script setup lang="ts">
defineProps<{
  label?: string
  required?: boolean
  placeholder?: string
  modelValue?: string
  variant?: 'dropdown' | 'text'
  disabled?: boolean
  inputType?: 'text' | 'password' | 'email' | 'number'
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'click'): void
}>()
</script>

<template>
  <div class="s-textfield">
    <!-- Label row -->
    <div v-if="label" class="s-textfield__label-row">
      <label class="s-textfield__label">{{ label }}</label>
      <span v-if="required" class="s-textfield__required">*</span>
    </div>

    <!-- Dropdown variant -->
    <button
      v-if="variant === 'dropdown'"
      type="button"
      class="s-textfield__input-box"
      :disabled="disabled"
      @click="$emit('click')"
    >
      <span
        class="s-textfield__value"
        :class="{ 's-textfield__value--placeholder': !modelValue }"
      >
        {{ modelValue || placeholder || 'Ketik di sini...' }}
      </span>
      <svg
        class="s-textfield__chevron"
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

    <!-- Text variant -->
    <input
      v-else
      :type="inputType || 'text'"
      class="s-textfield__input-box s-textfield__input-text"
      :placeholder="placeholder || 'Ketik di sini...'"
      :value="modelValue"
      :disabled="disabled"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped>
.s-textfield {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.s-textfield__label-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.s-textfield__label {
  color: var(--color-general-black, #333);
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
}

.s-textfield__required {
  color: var(--color-general-red, #FC6668);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  line-height: 16px;
}

.s-textfield__input-box {
  display: flex;
  padding: 12px 16px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  border-radius: 8px;
  border: 1px solid var(--color-general-border, #D9D9D9);
  background: var(--color-general-white, #FFF);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.s-textfield__input-box:hover {
  border-color: var(--color-blue-500, #2E3094);
}

.s-textfield__input-box:focus,
.s-textfield__input-box:focus-visible {
  outline: none;
  border-color: var(--color-blue-500, #2E3094);
  box-shadow: 0 0 0 2px rgba(46, 48, 148, 0.15);
}

.s-textfield__input-text {
  color: var(--color-general-black, #333);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
}

.s-textfield__input-text::placeholder {
  color: var(--color-neutral-300, #AEAEAE);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
}

.s-textfield__value {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 0 0;
  color: var(--color-general-black, #333);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  text-align: left;
}

.s-textfield__value--placeholder {
  color: var(--color-neutral-300, #AEAEAE);
}

.s-textfield__chevron {
  width: 20px;
  height: 20px;
  aspect-ratio: 1/1;
  flex-shrink: 0;
}
</style>
