<script setup lang="ts">
defineProps<{
  label: string
  variant?: 'outline' | 'outline-filled' | 'solid' | 'light'
}>()
</script>

<template>
  <span
    class="s-chip"
    :class="[`s-chip--${variant || 'outline'}`]"
  >
    <span class="s-chip__icon">
      <slot name="icon" />
    </span>
    <span class="s-chip__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.s-chip {
  display: inline-flex;
  padding: 8px 16px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.s-chip__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.s-chip__icon:empty {
  display: none;
}

.s-chip__label {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
}

/* ---- Variant: outline ---- */
.s-chip--outline {
  border: 1px solid var(--color-blue-500, #2E3094);
  background: transparent;
}
.s-chip--outline .s-chip__label {
  color: var(--color-blue-500, #2E3094);
}
.s-chip--outline:hover {
  background: var(--color-blue-50, #EAEAF4);
}

/* ---- Variant: outline-filled ---- */
.s-chip--outline-filled {
  border: 1px solid var(--color-blue-500, #2E3094);
  background: var(--color-blue-50, #EAEAF4);
}
.s-chip--outline-filled .s-chip__label {
  color: var(--color-blue-500, #2E3094);
}
.s-chip--outline-filled:hover {
  background: var(--color-blue-100, #BEBFDE);
}

/* ---- Variant: solid ---- */
.s-chip--solid {
  border: none;
  background: var(--color-blue-500, #2E3094);
}
.s-chip--solid .s-chip__label {
  color: var(--color-general-white, #FFF);
}
.s-chip--solid:hover {
  background: var(--color-blue-600, #2A2C87);
}

/* ---- Variant: light ---- */
.s-chip--light {
  border: none;
  background: var(--color-blue-50, #EAEAF4);
}
.s-chip--light .s-chip__label {
  color: var(--color-blue-600, #2A2C87);
}
.s-chip--light:hover {
  background: var(--color-blue-100, #BEBFDE);
}
</style>
