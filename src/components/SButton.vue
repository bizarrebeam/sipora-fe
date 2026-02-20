<script setup lang="ts">
defineProps<{
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'light'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    class="s-button"
    :class="[`s-button--${variant || 'primary'}`]"
    :type="type || 'button'"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <span class="s-button__icon">
      <slot name="icon" />
    </span>
    <span class="s-button__label">{{ label }}</span>
  </button>
</template>

<style scoped>
.s-button {
  display: inline-flex;
  padding: 16px 20px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.s-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.s-button__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  aspect-ratio: 1/1;
}

.s-button__icon:empty {
  display: none;
}

.s-button__label {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
}

/* ---- Variant: Primary ---- */
.s-button--primary {
  background: var(--color-blue-500, #2E3094);
}
.s-button--primary .s-button__label {
  color: var(--color-general-white, #FFF);
}
.s-button--primary:hover:not(:disabled) {
  background: var(--color-blue-600, #2A2C87);
}
.s-button--primary:active:not(:disabled) {
  background: var(--color-blue-700, #212269);
}

/* ---- Variant: Secondary ---- */
.s-button--secondary {
  background: var(--color-blue-50, #EAEAF4);
}
.s-button--secondary .s-button__label {
  color: var(--color-blue-600, #2A2C87);
}
.s-button--secondary:hover:not(:disabled) {
  background: var(--color-blue-100, #BEBFDE);
}
.s-button--secondary:active:not(:disabled) {
  background: var(--color-blue-200, #9FA0CE);
}

/* ---- Variant: Ghost ---- */
.s-button--ghost {
  background: transparent;
  border: 1px solid var(--color-blue-600, #2A2C87);
}
.s-button--ghost .s-button__label {
  color: var(--color-blue-600, #2A2C87);
}
.s-button--ghost:hover:not(:disabled) {
  background: var(--color-blue-50, #EAEAF4);
}
.s-button--ghost:active:not(:disabled) {
  background: var(--color-blue-100, #BEBFDE);
}

/* ---- Variant: Light ---- */
.s-button--light {
  background: var(--color-general-white, #FFF);
  border: 1px solid var(--color-general-border, #D9D9D9);
}
.s-button--light .s-button__label {
  color: var(--color-general-black, #333); /* Warna teks dikembalikan ke gelap */
}
.s-button--light:hover:not(:disabled) {
  background: var(--color-general-frame, #F8FAFC);
}
.s-button--light:active:not(:disabled) {
  background: var(--color-general-border, #D9D9D9);
}
</style>